'use client'

import React, { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAndUploadReels, subscribeToProgress, unsubscribeFromProgress } from '../actions/fetchAndUploadReels'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { v4 as uuidv4 } from 'uuid'

export function ReelFetcher() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [sessionId, setSessionId] = useState('')
 
  const router = useRouter()

  const [formData, setFormData] = useState({
    locationName: '',
    reelCount: 1,
  })

  useEffect(() => {
    const newSessionId = uuidv4()
    setSessionId(newSessionId)

    const handleProgress = (data: any) => {
      if (data.type === 'progress') {
        setProgress(data.progress)
        setStatusMessage(data.message)
      } else if (data.type === 'error') {
        setStatusMessage(data.message)
        setIsSubmitting(false)
      }
    }

    const setupSubscription = async () => {
      await subscribeToProgress(newSessionId, handleProgress)
    }

    setupSubscription()

    return () => {
      const cleanupSubscription = async () => {
        await unsubscribeFromProgress(newSessionId, handleProgress)
      }
      cleanupSubscription()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'reelCount' ? parseInt(value) : value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setProgress(0)
    setStatusMessage('Initiating reel fetch and upload...')

    try {
      const result = await fetchAndUploadReels(formData, sessionId)
      if (result.success) {
        setStatusMessage(result.message)
        setProgress(100)
        setFormData({
          locationName: '',
          reelCount: 1,
        })
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

  const handleAutofill = (location: any) => {
    setFormData({
      ...formData,
      locationName: location.name,
    })
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
              {searchResults.map((location: any) => (
                <li key={location._id} className="border p-4 rounded-md">
                  <h4 className="font-bold">{location.name}</h4>
                  <p><strong>Address:</strong> {location.formattedAddress}</p>
                  <p><strong>Instagram Username:</strong> {location.instagramUsername}</p>
                  <Button onClick={() => handleAutofill(location)} className="mt-2">Select</Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reelCount">Number of Reels to Fetch</Label>
            <Input
              id="reelCount"
              name="reelCount"
              type="number"
              min="1"
              value={formData.reelCount}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Fetch and Upload Reels'}
          </Button>
        </form>

        {isSubmitting && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500">{`${progress}% complete`}</p>
          </div>
        )}

        {statusMessage && (
          <Alert className="mt-4">
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}