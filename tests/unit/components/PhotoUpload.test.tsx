/**
 * Component Tests - Photo Upload UI
 * Tests React component for photo upload with compression and preview
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock PhotoUpload Component
interface PhotoUploadProps {
  onUpload: (file: File) => Promise<void>;
  onCompress?: (file: File) => Promise<Blob>;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
}

function PhotoUpload({
  onUpload,
  onCompress,
  maxSize = 10 * 1024 * 1024,
  accept = 'image/*',
  multiple = false,
}: PhotoUploadProps) {
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [compressing, setCompressing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }

      if (file.size > maxSize) {
        setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      try {
        // Compress if handler provided
        let fileToUpload = file;
        if (onCompress && file.size > 1024 * 1024) {
          setCompressing(true);
          const compressed = await onCompress(file);
          fileToUpload = new File([compressed], file.name, { type: file.type });
          setCompressing(false);
        }

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(fileToUpload);

        // Upload
        setUploading(true);
        await onUpload(fileToUpload);
        setUploading(false);
      } catch (err) {
        setError((err as Error).message);
        setUploading(false);
        setCompressing(false);
      }
    }
  };

  return (
    <div data-testid="photo-upload">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        data-testid="file-input"
        disabled={uploading || compressing}
      />

      {compressing && (
        <div data-testid="compression-progress">Compressing...</div>
      )}

      {uploading && (
        <div data-testid="upload-progress">Uploading...</div>
      )}

      {error && (
        <div data-testid="upload-error" role="alert">
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div data-testid="photo-previews">
          {previews.map((preview, index) => (
            <img
              key={index}
              src={preview}
              alt={`Preview ${index + 1}`}
              data-testid={`photo-preview-${index}`}
              style={{ width: '100px', height: '100px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Need to import React for component
import React from 'react';

describe('PhotoUpload Component', () => {
  let mockOnUpload: jest.Mock;
  let mockOnCompress: jest.Mock;

  beforeEach(() => {
    mockOnUpload = jest.fn().mockResolvedValue(undefined);
    mockOnCompress = jest.fn().mockImplementation(async (file: File) => {
      return new Blob([await file.arrayBuffer()], { type: file.type });
    });
  });

  describe('Rendering', () => {
    it('should render file input', () => {
      render(<PhotoUpload onUpload={mockOnUpload} />);

      const input = screen.getByTestId('file-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
      expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('should support multiple file uploads', () => {
      render(<PhotoUpload onUpload={mockOnUpload} multiple />);

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('multiple');
    });

    it('should accept custom file types', () => {
      render(<PhotoUpload onUpload={mockOnUpload} accept="image/jpeg,image/png" />);

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('accept', 'image/jpeg,image/png');
    });
  });

  describe('File Selection', () => {
    it('should handle file selection', async () => {
      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(expect.any(File));
      });
    });

    it('should validate image file type', async () => {
      render(<PhotoUpload onUpload={mockOnUpload} />);

      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, pdfFile);

      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toHaveTextContent('File must be an image');
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('should validate file size', async () => {
      const maxSize = 1024 * 1024; // 1MB
      render(<PhotoUpload onUpload={mockOnUpload} maxSize={maxSize} />);

      const largeFile = new File(
        [new ArrayBuffer(2 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toHaveTextContent('File size exceeds 1MB limit');
      });
    });

    it('should handle multiple files', async () => {
      render(<PhotoUpload onUpload={mockOnUpload} multiple />);

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, files);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Photo Compression', () => {
    it('should compress large photos before upload', async () => {
      render(
        <PhotoUpload
          onUpload={mockOnUpload}
          onCompress={mockOnCompress}
        />
      );

      const largeFile = new File(
        [new ArrayBuffer(2 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.queryByTestId('compression-progress')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockOnCompress).toHaveBeenCalledWith(largeFile);
      });
    });

    it('should show compression progress', async () => {
      let resolveCompress: (value: Blob) => void;
      const compressPromise = new Promise<Blob>((resolve) => {
        resolveCompress = resolve;
      });

      mockOnCompress.mockReturnValue(compressPromise);

      render(
        <PhotoUpload
          onUpload={mockOnUpload}
          onCompress={mockOnCompress}
        />
      );

      const largeFile = new File(
        [new ArrayBuffer(2 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, largeFile);

      expect(screen.getByTestId('compression-progress')).toBeInTheDocument();

      // Resolve compression
      resolveCompress!(new Blob(['compressed'], { type: 'image/jpeg' }));

      await waitFor(() => {
        expect(screen.queryByTestId('compression-progress')).not.toBeInTheDocument();
      });
    });

    it('should skip compression for small files', async () => {
      render(
        <PhotoUpload
          onUpload={mockOnUpload}
          onCompress={mockOnCompress}
        />
      );

      const smallFile = new File(
        [new ArrayBuffer(500 * 1024)],
        'small.jpg',
        { type: 'image/jpeg' }
      );
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, smallFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });

      expect(mockOnCompress).not.toHaveBeenCalled();
    });
  });

  describe('Photo Preview', () => {
    it('should generate photo preview after selection', async () => {
      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as ((e: any) => void) | null,
        result: 'data:image/jpeg;base64,test',
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      await userEvent.upload(input, file);

      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }

      await waitFor(() => {
        expect(screen.getByTestId('photo-previews')).toBeInTheDocument();
      });
    });

    it('should show multiple previews for multiple files', async () => {
      render(<PhotoUpload onUpload={mockOnUpload} multiple />);

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, files);

      await waitFor(() => {
        expect(screen.getAllByTestId(/photo-preview-/)).toHaveLength(2);
      });
    });
  });

  describe('Upload State', () => {
    it('should show upload progress', async () => {
      let resolveUpload: () => void;
      const uploadPromise = new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });

      mockOnUpload.mockReturnValue(uploadPromise);

      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByTestId('upload-progress')).toBeInTheDocument();

      // Resolve upload
      resolveUpload!();

      await waitFor(() => {
        expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument();
      });
    });

    it('should disable input during upload', async () => {
      let resolveUpload: () => void;
      const uploadPromise = new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });

      mockOnUpload.mockReturnValue(uploadPromise);

      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(input).toBeDisabled();

      resolveUpload!();

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display upload errors', async () => {
      const errorMessage = 'Upload failed';
      mockOnUpload.mockRejectedValue(new Error(errorMessage));

      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toHaveTextContent(errorMessage);
      });
    });

    it('should clear errors on new upload attempt', async () => {
      mockOnUpload.mockRejectedValueOnce(new Error('First error'));

      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      // First upload fails
      await userEvent.upload(input, file1);

      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument();
      });

      // Second upload succeeds
      mockOnUpload.mockResolvedValueOnce(undefined);
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

      await userEvent.upload(input, file2);

      await waitFor(() => {
        expect(screen.queryByTestId('upload-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error messages', async () => {
      mockOnUpload.mockRejectedValue(new Error('Upload failed'));

      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        const error = screen.getByTestId('upload-error');
        expect(error).toHaveAttribute('role', 'alert');
      });
    });

    it('should have alt text for preview images', async () => {
      render(<PhotoUpload onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        const preview = screen.getByAltText('Preview 1');
        expect(preview).toBeInTheDocument();
      });
    });
  });
});
