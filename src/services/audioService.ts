import { Audio } from 'expo-av';
import { supabaseService } from './supabaseService';

export interface AudioRecordingConfig {
  sampleRate?: number;
  numberOfChannels?: number;
  bitRate?: number;
  quality?: 'low' | 'standard' | 'high';
}

export interface AudioData {
  uri: string;
  publicUrl: string;
  filePath: string;
  duration: number;
  timestamp: string;
  format: string;
  sampleRate: number;
  numberOfChannels: number;
  bitRate: number;
  fileSize: number;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  /**
   * Solicita permisos de audio
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Configurar modo de audio para grabación
   */
  async setupAudioMode(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
  }

  /**
   * Obtener configuración de grabación optimizada
   */
  private getRecordingOptions(config: AudioRecordingConfig) {
    const defaultConfig = {
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      quality: 'high' as const,
      ...config
    };

    return {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: defaultConfig.sampleRate,
        numberOfChannels: defaultConfig.numberOfChannels,
        bitRate: defaultConfig.bitRate,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: defaultConfig.quality === 'high' ? Audio.IOSAudioQuality.HIGH : Audio.IOSAudioQuality.MEDIUM,
        sampleRate: defaultConfig.sampleRate,
        numberOfChannels: defaultConfig.numberOfChannels,
        bitRate: defaultConfig.bitRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/mp4',
        bitsPerSecond: defaultConfig.bitRate,
      },
    };
  }

  /**
   * Iniciar grabación de audio
   */
  async startRecording(config: AudioRecordingConfig = {}): Promise<void> {
    if (this.isRecording) {
      throw new Error('Ya hay una grabación en progreso');
    }

    try {
      // Verificar permisos
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permisos de audio denegados');
      }

      // Configurar modo de audio
      await this.setupAudioMode();

      // Crear grabación
      const recordingOptions = this.getRecordingOptions(config);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      
      this.recording = recording;
      this.isRecording = true;
      
      console.log('✅ Grabación de audio iniciada');
    } catch (error) {
      this.isRecording = false;
      console.error('❌ Error iniciando grabación:', error);
      throw error;
    }
  }

  /**
   * Detener grabación y subir a Supabase Storage
   */
  async stopRecording(): Promise<AudioData> {
    if (!this.recording || !this.isRecording) {
      throw new Error('No hay grabación activa');
    }

    try {
      console.log('🔄 Finalizando grabación...');
      
      // Detener grabación
      await this.recording.stopAndUnloadAsync();
      const localUri = this.recording.getURI();
      
      if (!localUri) {
        throw new Error('No se pudo obtener el URI de la grabación');
      }

      // Obtener status para metadata
      const status = await this.recording.getStatusAsync();
      const durationSeconds = Math.floor((status.durationMillis || 0) / 1000);

      console.log('📤 Subiendo audio a Supabase Storage...');
      
      // Subir directamente a Supabase Storage
      const fileName = `audio_${Date.now()}.m4a`;
      const { publicUrl, filePath } = await supabaseService.uploadAudioFile(localUri, fileName);

      // Obtener tamaño del archivo
      const response = await fetch(localUri);
      const blob = await response.blob();
      const fileSize = blob.size;

      console.log('✅ Audio subido exitosamente:', publicUrl);

      // Limpiar recursos locales
      this.recording = null;
      this.isRecording = false;

      // Retornar datos completos del audio
      return {
        uri: publicUrl, // URL público de Supabase Storage
        publicUrl,
        filePath,
        duration: durationSeconds,
        timestamp: new Date().toISOString(),
        format: 'm4a',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        fileSize,
      };

    } catch (error) {
      console.error('❌ Error finalizando grabación:', error);
      
      // Limpiar estado en caso de error
      this.recording = null;
      this.isRecording = false;
      
      throw error;
    }
  }

  /**
   * Cancelar grabación actual
   */
  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.warn('Error stopping recording during cancel:', error);
      }
    }
    
    this.recording = null;
    this.isRecording = false;
  }

  /**
   * Obtener status de grabación actual
   */
  async getRecordingStatus() {
    if (!this.recording || !this.isRecording) {
      return null;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return {
        isRecording: status.isRecording,
        durationMillis: status.durationMillis || 0,
        durationSeconds: Math.floor((status.durationMillis || 0) / 1000),
        metering: status.metering,
      };
    } catch (error) {
      console.error('Error getting recording status:', error);
      return null;
    }
  }

  /**
   * Verificar si hay una grabación activa
   */
  get isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

export const audioService = new AudioService(); 