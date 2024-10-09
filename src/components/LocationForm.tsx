'use client'

import React, { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addLocation } from '../actions/addLocation'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface InstagramUser {
  id: string;
  username: string;
  full_name: string;
  followers: number;
  biography: string;
  profile_pic_url: string;
}

export function LocationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [categories, setCategories] = useState([])
 
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramPreview, setInstagramPreview] = useState<InstagramUser | null>(null);
  const [isLoadingInstagram, setIsLoadingInstagram] = useState(false);

  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    formattedAddress: '',
    placeId: '',
    latitude: '',
    longitude: '',
    neLatitude: '',
    neLongitude: '',
    swLatitude: '',
    swLongitude: '',
    category: '',
    instagramId: '',
    instagramUsername: '',
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/fetch-categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleFetchInstagramUser = async () => {
    if (!instagramUsername) return;

    setIsLoadingInstagram(true);
    try {
      const response = await fetch(`/api/fetch-instagram-user?username=${instagramUsername}`);
      const data = await response.json();
      if (data.data) {
        setInstagramPreview(data.data);
      } else {
        alert('Failed to fetch Instagram user data');
      }
    } catch (error) {
      console.error('Error fetching Instagram user:', error);
      alert('An error occurred while fetching Instagram user data');
    } finally {
      setIsLoadingInstagram(false);
    }
  };

  const handleChange = (
    e: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName?: string
  ) => {
    if (typeof e === 'string' && fieldName) {
      // This is for the Select component
      setFormData(prev => ({ ...prev, [fieldName]: e }));
    } else if (typeof e === 'object' && 'target' in e) {
      // This is for regular input fields
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const numericFormData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      neLatitude: parseFloat(formData.neLatitude),
      neLongitude: parseFloat(formData.neLongitude),
      swLatitude: parseFloat(formData.swLatitude),
      swLongitude: parseFloat(formData.swLongitude),
    }

    try {
      const result = await addLocation(numericFormData)
      if (result.success) {
        alert(result.message)
        setFormData({
          name: '',
          formattedAddress: '',
          placeId: '',
          latitude: '',
          longitude: '',
          neLatitude: '',
          neLongitude: '',
          swLatitude: '',
          swLongitude: '',
          category: '',
          instagramId: '',
          instagramUsername: '',
        })
        setInstagramPreview(null); // Clear Instagram preview
        setInstagramUsername(''); // Clear Instagram username input
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error adding location:', error)
      alert('An error occurred while adding the location. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/search-places?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Error searching places:', error)
      alert('An error occurred while searching for places. Please try again.')
    }
  }

  const handleAutofill = (place: any) => {
    setFormData({
      ...formData,
      name: place.name,
      formattedAddress: place.formatted_address,
      placeId: place.place_id,
      latitude: place.geometry.location.lat.toString(),
      longitude: place.geometry.location.lng.toString(),
      neLatitude: place.geometry.viewport.northeast.lat.toString(),
      neLongitude: place.geometry.viewport.northeast.lng.toString(),
      swLatitude: place.geometry.viewport.southwest.lat.toString(),
      swLongitude: place.geometry.viewport.southwest.lng.toString(),
    })
    setSearchResults([])
    setSearchQuery('')
  }

  const handleInstagramAutofill = () => {
    if (instagramPreview) {
      setFormData(prev => ({
        ...prev,
        instagramId: instagramPreview.id,
        instagramUsername: instagramPreview.username,
      }));
    }
    setInstagramPreview(null); // Clear Instagram preview
    setInstagramUsername(''); // Clear Instagram username input
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Location</CardTitle>
        <CardDescription>Search for a location or enter details manually</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <Label htmlFor="search">Search for a place</Label>
          <div className="flex space-x-2">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter a place name"
            />
<Button onClick={handleSearch} className="bg-red-500 hover:bg-red-600">Google Search</Button>          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Search Results:</h3>
            <ul className="space-y-4">
              {searchResults.map((place: any) => (
                <li key={place.place_id} className="border p-4 rounded-md">
                  <h4 className="font-bold">{place.name}</h4>
                  <p><strong>Formatted Address:</strong> {place.formatted_address}</p>
                  <p><strong>Place ID:</strong> {place.place_id}</p>
                  <Button onClick={() => handleAutofill(place)} className="mt-2">Autofill</Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2 mt-4">
          <Label htmlFor="instagramUsername">Instagram Username</Label>
          <div className="flex space-x-2">
            <Input
              id="instagramUsername"
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value)}
              placeholder="Enter Instagram username"
            />
          <Button type="button" onClick={handleFetchInstagramUser} disabled={isLoadingInstagram} className="bg-purple-500 hover:bg-purple-600">
  {isLoadingInstagram ? 'Fetching...' : 'Insta Search'}
</Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Make sure the Instagram username is exact and check the preview to verify</p>

        </div>

        {instagramPreview && (
          <div className="space-y-2 border p-4 rounded-md mt-4">
            <h3 className="font-semibold">Instagram User Preview</h3>
            <p><strong>ID:</strong> {instagramPreview.id}</p>
            <p><strong>Username:</strong> {instagramPreview.username}</p>
            <p><strong>Full Name:</strong> {instagramPreview.full_name}</p>
            <p><strong>Followers:</strong> {instagramPreview.followers.toLocaleString()}</p>
            <p><strong>Bio:</strong> {instagramPreview.biography}</p>
            <img src={instagramPreview.profile_pic_url} alt={`${instagramPreview.full_name}'s profile`} className="w-20 h-20 rounded-full" />
            <Button type="button" onClick={handleInstagramAutofill}>Autofill Instagram Data</Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="formattedAddress">Formatted Address</Label>
            <Textarea
              id="formattedAddress"
              name="formattedAddress"
              value={formData.formattedAddress}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placeId">Place ID</Label>
            <Input
              id="placeId"
              name="placeId"
              value={formData.placeId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neLatitude">Northeast Latitude</Label>
              <Input
                id="neLatitude"
                name="neLatitude"
                value={formData.neLatitude}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neLongitude">Northeast Longitude</Label>
              <Input
                id="neLongitude"
                name="neLongitude"
                value={formData.neLongitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="swLatitude">Southwest Latitude</Label>
              <Input
                id="swLatitude"
                name="swLatitude"
                value={formData.swLatitude}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swLongitude">Southwest Longitude</Label>
              <Input
                id="swLongitude"
                name="swLongitude"
                value={formData.swLongitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => handleChange(value, 'category')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramId">Instagram ID</Label>
            <Input
              id="instagramId"
              name="instagramId"
              value={formData.instagramId}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUsername">Instagram Username</Label>
            <Input
              id="instagramUsername"
              name="instagramUsername"
              value={formData.instagramUsername}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Location'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}