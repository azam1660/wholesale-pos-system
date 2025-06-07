"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, X, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "./crop-utils"

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageData: string | null) => void
  aspectRatio?: number
  maxWidth?: number
  maxHeight?: number
}

export default function ImageUpload({
  currentImage,
  onImageChange,
  aspectRatio = 1,
  maxWidth = 200,
  maxHeight = 200,
}: ImageUploadProps) {
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
        setShowCropDialog(true)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, maxWidth, maxHeight)
      onImageChange(croppedImage)
      setShowCropDialog(false)
      setImageSrc("")
    } catch (error) {
      console.error("Error cropping image:", error)
      alert("Error processing image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveImage = () => {
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCropCancel = () => {
    setShowCropDialog(false)
    setImageSrc("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <Label>Category Image (Optional)</Label>

      <div className="flex items-center gap-3">
        {/* Current Image Preview */}
        {currentImage && (
          <div className="relative">
            <img
              src={currentImage || "/placeholder.svg"}
              alt="Category"
              className="w-16 h-16 object-cover rounded-[9px] border-2 border-gray-200"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-[9px]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {currentImage ? "Change Image" : "Upload Image"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB. Images will be resized to {maxWidth}x{maxHeight}px.
      </p>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div className="relative w-full h-64 bg-gray-100 rounded-[9px] overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: {
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#f3f4f6",
                    },
                  }}
                />
              )}
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <Label className="text-sm">Zoom</Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCropCancel} className="rounded-[9px]">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCropSave}
                disabled={isProcessing}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                {isProcessing ? (
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isProcessing ? "Processing..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
