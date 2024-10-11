'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { addCategory } from '../actions/addCategory'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function CategoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    popularityPercentage: '',
    type: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const numericFormData = {
      ...formData,
      popularityPercentage: parseInt(formData.popularityPercentage),
    }

    try {
      const result = await addCategory(numericFormData)
      if (result.success) {
        alert(result.message)
        setFormData({
          name: '',
          popularityPercentage: '',
          type: '',
        })
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert('An error occurred while adding the category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Category</CardTitle>
        <CardDescription>Enter the details for a new category</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="popularityPercentage">Popularity Percentage</Label>
            <Input
              id="popularityPercentage"
              name="popularityPercentage"
              type="number"
              min="0"
              max="100"
              value={formData.popularityPercentage}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Category'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}