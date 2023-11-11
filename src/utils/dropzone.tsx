import { Box } from '@gluestack-ui/themed';
import React from 'react';
import { useDropzone } from 'react-dropzone';

export const toBase64 = (file: File) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

export type FileWithPreview = File & { preview: string };

export type DropzoneProps = {
    dropzoneOptions?: Object;
    onAcceptedFiles: (files: FileWithPreview[]) => void;
} & any;

export type DropzoneComponent = React.FC<React.PropsWithChildren<DropzoneProps>>;

export const Dropzone: DropzoneComponent = ({
    onAcceptedFiles,
    dropzoneOptions,
    children,
    ...otherProps
}): JSX.Element => {
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            onAcceptedFiles(
                acceptedFiles.map(
                    (file: File): FileWithPreview => Object.assign(file, { preview: URL.createObjectURL(file) })
                )
            );
        },
        ...(dropzoneOptions || {}),
    });

    return (
        <Box {...(getRootProps() as any)} {...otherProps}>
            <input {...getInputProps()} />
            {children}
        </Box>
    );
};
