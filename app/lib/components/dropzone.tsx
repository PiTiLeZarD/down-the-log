import { PropsWithChildren } from "react";
import { useDropzone } from "react-dropzone";
import { View, ViewProps } from "react-native";

export const toBase64 = (file: File) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

export type FileWithPreview = File & { preview: string };

export type DropzoneProps = PropsWithChildren<{
    dropzoneOptions?: object;
    onAcceptedFiles: (files: FileWithPreview[]) => void;
} & ViewProps>;

export const Dropzone = ({
    onAcceptedFiles,
    dropzoneOptions,
    children,
    ...otherProps
}: DropzoneProps) => {
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            onAcceptedFiles(
                acceptedFiles.map(
                    (file: File): FileWithPreview => Object.assign(file, { preview: URL.createObjectURL(file) }),
                ),
            );
        },
        ...(dropzoneOptions || {}),
    });

    return (
        <View {...(getRootProps() as any)} {...otherProps}>
            <input {...getInputProps()} />
            {children}
        </View>
    );
};
