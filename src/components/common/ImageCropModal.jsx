import { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const CM_TO_PX_300DPI = 300 / 2.54

function getDefaultCrop(mediaWidth, mediaHeight, aspect = 1) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

async function getCroppedCanvas(image, crop, maxWidthPx, maxHeightPx) {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  let pixelCrop
  if (crop.unit === '%') {
    pixelCrop = {
      x: (crop.x / 100) * image.naturalWidth,
      y: (crop.y / 100) * image.naturalHeight,
      width: (crop.width / 100) * image.naturalWidth,
      height: (crop.height / 100) * image.naturalHeight,
    }
  } else {
    pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    }
  }

  let outWidth = pixelCrop.width
  let outHeight = pixelCrop.height
  if (maxWidthPx && maxHeightPx) {
    const scale = Math.min(maxWidthPx / outWidth, maxHeightPx / outHeight, 1)
    if (scale < 1) {
      outWidth = Math.round(outWidth * scale)
      outHeight = Math.round(outHeight * scale)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight
  )

  return canvas
}

const ImageCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onConfirm,
  fileName = 'logo.png',
  logoDimensoesMaximas = { largura_cm: 2.5, altura_cm: 2.5 },
}) => {
  const imgRef = useRef(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [processing, setProcessing] = useState(false)

  const larguraCm = logoDimensoesMaximas.largura_cm ?? 2.5
  const alturaCm = logoDimensoesMaximas.altura_cm ?? 2.5
  const aspect = larguraCm / alturaCm
  const maxWidthPx = Math.round(larguraCm * CM_TO_PX_300DPI)
  const maxHeightPx = Math.round(alturaCm * CM_TO_PX_300DPI)

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    const defaultCrop = getDefaultCrop(width, height, aspect)
    setCrop(defaultCrop)
    setCompletedCrop(defaultCrop)
  }, [aspect])

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) {
      onClose()
      return
    }

    setProcessing(true)
    try {
      const canvas = await getCroppedCanvas(
        imgRef.current,
        completedCrop,
        maxWidthPx,
        maxHeightPx
      )
      if (!canvas) {
        alert('Erro ao processar a imagem.')
        return
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const file = new File([blob], fileName, { type: blob.type || 'image/png' })
          onConfirm(file)
          onClose()
        },
        'image/png',
        0.95
      )
    } catch (error) {
      console.error('Erro ao recortar imagem:', error)
      alert('Erro ao recortar imagem.')
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setCrop(undefined)
    setCompletedCrop(undefined)
    onClose()
  }

  if (!isOpen || !imageSrc) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Selecionar área da imagem"
      size="xl"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={processing}
            disabled={!completedCrop}
          >
            Confirmar
          </Button>
        </>
      }
    >
      <p className="text-sm text-secondary-600 mb-4">
        Selecione a área da imagem para a logomarca. No PDF, ela será exibida em até{' '}
        <strong>{larguraCm} cm × {alturaCm} cm</strong> no canto superior esquerdo. Ajuste o
        recorte para que o nome da empresa fique legível.
      </p>
      <div className="max-h-[60vh] overflow-auto flex justify-center bg-secondary-50 rounded-lg p-4">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
          aspect={aspect}
          className="max-w-full"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Recorte"
            onLoad={onImageLoad}
            className="max-w-full max-h-[50vh] object-contain"
          />
        </ReactCrop>
      </div>
    </Modal>
  )
}

export default ImageCropModal
