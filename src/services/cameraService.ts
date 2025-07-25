import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabaseService } from './supabaseService';

export interface CameraConfig {
  quality?: number; // 0-1, donde 1 es máxima calidad
  allowsEditing?: boolean;
  aspect?: [number, number];
  mediaTypes?: 'photo' | 'video' | 'both';
  videoMaxDuration?: number; // en segundos
}

export interface MediaData {
  uri: string;
  publicUrl: string;
  filePath: string;
  type: 'photo' | 'video';
  width: number;
  height: number;
  duration?: number; // solo para videos, en segundos
  fileSize: number;
  timestamp: string;
  format: string;
  thumbnail?: string; // para videos
}

class CameraService {
  private isCapturing = false;

  /**
   * Solicita permisos de cámara
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📷 Solicitando permisos de cámara...');
      
      // Permisos de cámara
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      console.log('📷 Permiso de cámara:', cameraPermission.status);
      
      // Permisos de galería
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🖼️ Permiso de galería:', galleryPermission.status);
      
      const hasPermissions = 
        cameraPermission.status === 'granted' && 
        galleryPermission.status === 'granted';
      
      if (hasPermissions) {
        console.log('✅ Permisos de cámara otorgados');
      } else {
        console.warn('❌ Permisos de cámara denegados');
      }
      
      return hasPermissions;
    } catch (error) {
      console.error('❌ Error solicitando permisos de cámara:', error);
      return false;
    }
  }

  /**
   * Abre la cámara para tomar foto o grabar video
   */
  async openCamera(config: CameraConfig = {}): Promise<MediaData> {
    if (this.isCapturing) {
      throw new Error('Ya hay una captura en progreso');
    }

    try {
      this.isCapturing = true;
      console.log('📷 Abriendo cámara con configuración:', config);

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: this.getMediaTypes(config.mediaTypes || 'photo'),
        allowsEditing: config.allowsEditing ?? true,
        aspect: config.aspect,
        quality: config.quality ?? 0.8,
        videoMaxDuration: config.videoMaxDuration ?? 60, // máximo 60 segundos por defecto
      };

      const result = await ImagePicker.launchCameraAsync(options);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Captura cancelada por el usuario');
      }

      const asset = result.assets[0];
      console.log('📸 Media capturada:', {
        type: asset.type,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        fileSize: asset.fileSize,
        uri: asset.uri
      });

      return await this.processAndUploadMedia(asset);

    } catch (error) {
      console.error('❌ Error en captura de cámara:', error);
      throw error;
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Abre la galería para seleccionar foto o video
   */
  async openGallery(config: CameraConfig = {}): Promise<MediaData> {
    if (this.isCapturing) {
      throw new Error('Ya hay una captura en progreso');
    }

    try {
      this.isCapturing = true;
      console.log('🖼️ Abriendo galería con configuración:', config);

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: this.getMediaTypes(config.mediaTypes || 'photo'),
        allowsEditing: config.allowsEditing ?? true,
        aspect: config.aspect,
        quality: config.quality ?? 0.8,
        videoMaxDuration: config.videoMaxDuration ?? 60,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Selección cancelada por el usuario');
      }

      const asset = result.assets[0];
      console.log('📱 Media seleccionada:', {
        type: asset.type,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        fileSize: asset.fileSize,
        uri: asset.uri
      });

      return await this.processAndUploadMedia(asset);

    } catch (error) {
      console.error('❌ Error en selección de galería:', error);
      throw error;
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Procesa el media capturado y lo sube a Supabase
   */
  private async processAndUploadMedia(asset: ImagePicker.ImagePickerAsset): Promise<MediaData> {
    try {
      console.log('🔄 Procesando media para subida a Supabase...');

      const isVideo = asset.type === 'video';
      const fileExtension = this.getFileExtension(asset.uri, isVideo);
      const fileName = `${isVideo ? 'video' : 'photo'}.${fileExtension}`;

      // Generar thumbnail para videos
      let thumbnailUri: string | undefined;
      if (isVideo && asset.uri) {
        try {
          console.log('🎬 Generando thumbnail para video...');
          const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
            time: 1000, // thumbnail en el segundo 1
            quality: 0.5,
          });
          thumbnailUri = uri;
          console.log('✅ Thumbnail generado:', thumbnailUri);
        } catch (error) {
          console.warn('⚠️ No se pudo generar thumbnail:', error);
        }
      }

      // Subir archivo principal a Supabase
      console.log('📤 Subiendo media a Supabase Storage...');
      const { publicUrl, filePath } = await supabaseService.uploadMediaFile(asset.uri, fileName);

      // Subir thumbnail si existe
      let thumbnailUrl: string | undefined;
      if (thumbnailUri) {
        try {
          console.log('📤 Subiendo thumbnail a Supabase...');
          const thumbnailResult = await supabaseService.uploadMediaFile(
            thumbnailUri, 
            `thumbnail_${fileName.replace(/\.[^/.]+$/, '.jpg')}`
          );
          thumbnailUrl = thumbnailResult.publicUrl;
          console.log('✅ Thumbnail subido:', thumbnailUrl);
        } catch (error) {
          console.warn('⚠️ Error subiendo thumbnail:', error);
        }
      }

      const mediaData: MediaData = {
        uri: asset.uri,
        publicUrl,
        filePath,
        type: isVideo ? 'video' : 'photo',
        width: asset.width || 0,
        height: asset.height || 0,
        duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
        fileSize: asset.fileSize || 0,
        timestamp: new Date().toISOString(),
        format: fileExtension,
        thumbnail: thumbnailUrl,
      };

      console.log('✅ Media procesado y subido exitosamente:', {
        type: mediaData.type,
        size: `${mediaData.width}x${mediaData.height}`,
        duration: mediaData.duration ? `${mediaData.duration}s` : undefined,
        fileSize: `${(mediaData.fileSize / 1024 / 1024).toFixed(2)}MB`
      });

      return mediaData;

    } catch (error) {
      console.error('❌ Error procesando media:', error);
      throw new Error(`Error procesando ${asset.type === 'video' ? 'video' : 'foto'}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Convierte el tipo de media a formato de ImagePicker
   */
  private getMediaTypes(mediaTypes: 'photo' | 'video' | 'both'): ImagePicker.MediaType[] {
    switch (mediaTypes) {
      case 'photo':
        return ['images'];
      case 'video':
        return ['videos'];
      case 'both':
        return ['images', 'videos'];
      default:
        return ['images'];
    }
  }



  /**
   * Obtiene la extensión del archivo basado en el URI y tipo
   */
  private getFileExtension(uri: string, isVideo: boolean): string {
    // Intentar extraer extensión del URI
    const uriExtension = uri.split('.').pop()?.toLowerCase();
    
    if (uriExtension && this.isValidExtension(uriExtension, isVideo)) {
      return uriExtension;
    }

    // Fallback a extensiones por defecto
    return isVideo ? 'mp4' : 'jpg';
  }

  /**
   * Valida si la extensión es válida para el tipo de media
   */
  private isValidExtension(extension: string, isVideo: boolean): boolean {
    const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    
    return isVideo 
      ? videoExtensions.includes(extension)
      : photoExtensions.includes(extension);
  }

  /**
   * Cancela la captura actual
   */
  async cancelCapture(): Promise<void> {
    console.log('🚫 Cancelando captura de media...');
    this.isCapturing = false;
  }

  /**
   * Getter para verificar si hay captura en progreso
   */
  get isCurrentlyCapturing(): boolean {
    return this.isCapturing;
  }
}

export const cameraService = new CameraService(); 