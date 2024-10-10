'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAndUploadReels } from '../actions/fetchAndUploadReels'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Location {
  _id: string;
  name: string;
  formattedAddress: string;
  instagramUsername: string;
  instagramBio?: string;
}

export function ReelFetcher() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Location[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
 
  const router = useRouter()

  const [reelCount, setReelCount] = useState(1)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLocation) {
      setStatusMessage('Please select a location first.')
      return
    }
    setIsSubmitting(true)
    setStatusMessage('Initiating reel fetch and upload...')

    try {
      const result = await fetchAndUploadReels({
        locationId: selectedLocation._id,
        reelCount: reelCount,
      })
      if (result.success) {
        setStatusMessage(result.message)
        setSelectedLocation(null)
        setReelCount(1)
        router.refresh()
      } else {
        setStatusMessage(result.message)
      }
    } catch (error) {
      console.error('Error fetching and uploading reels:', error)
      setStatusMessage('An error occurred while fetching and uploading reels. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = async () => {
    try {
      setStatusMessage('Searching for locations...')
      const response = await fetch(`/api/fetch-location?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data || [])
      setStatusMessage(data.length ? `Found ${data.length} locations` : 'No locations found')
    } catch (error) {
      console.error('Error searching locations:', error)
      setStatusMessage('An error occurred while searching for locations. Please try again.')
    }
  }

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location)
    setSearchResults([])
    setSearchQuery('')
    setStatusMessage(`Selected location: ${location.name}`)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Fetch and Upload Reels</CardTitle>
        <CardDescription>Search for a location and specify the number of reels to fetch</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <Label htmlFor="search">Search for a location</Label>
          <div className="flex space-x-2">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter a location name"
            />
            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600">Search</Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Search Results:</h3>
            <ul className="space-y-4">
              {searchResults.map((location) => (
                <li key={location._id} className="border p-4 rounded-md">
                  <h4 className="font-bold">{location.name}</h4>
                  <p><strong>Address:</strong> {location.formattedAddress}</p>
                  <p><strong>Instagram Username:</strong> {location.instagramUsername}</p>
                  <p><strong>Instagram Bio:</strong> {location.instagramBio || 'N/A'}</p>
                  <Button onClick={() => handleSelectLocation(location)} className="mt-2">Select</Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedLocation && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Selected Location:</h3>
            <p><strong>{selectedLocation.name}</strong></p>
            <p>{selectedLocation.formattedAddress}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reelCount">Number of Reels to Fetch</Label>
            <Input
              id="reelCount"
              type="number"
              min="1"
              value={reelCount}
              onChange={(e) => setReelCount(parseInt(e.target.value))}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !selectedLocation}>
            {isSubmitting ? 'Processing...' : 'Fetch and Upload Reels'}
          </Button>
        </form>

        {statusMessage && (
          <Alert className="mt-4">
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}