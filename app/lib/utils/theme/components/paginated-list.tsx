import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "../../../components/stack";
import { Button } from "./button";
import { Typography } from "./typography";

export type PaginatedListProps = {
    itemsPerPage?: number;
    whenEmpty?: React.ReactNode;
};

export type PaginatedListComponent = React.FC<React.PropsWithChildren<PaginatedListProps>>;

export const PaginatedList: PaginatedListComponent = ({ itemsPerPage = 10, whenEmpty, children }): JSX.Element => {
    const elements = React.Children.toArray(children);
    const [page, setPage] = React.useState<number>(0);

    useEffect(() => setPage(0), [elements.length]);

    if (elements.length === 0) return <>{whenEmpty}</> || <Typography>No elements found</Typography>;
    if (elements.length <= itemsPerPage) return <>{children}</>;

    const showBack = page > 0;
    const showForward = page < elements.length / itemsPerPage - 1;
    return (
        <Stack>
            {elements.slice(page * itemsPerPage, (page + 1) * itemsPerPage)}
            <Stack direction="row">
                <View>
                    <Button
                        colour={showBack ? "primary" : "grey"}
                        startIcon="arrow-back"
                        onPress={!showBack ? () => {} : () => setPage(page - 1)}
                    />
                </View>
                <Typography style={{ flexGrow: 1, textAlign: "center" }}>
                    {page + 1} / {Math.ceil(elements.length / itemsPerPage)}
                </Typography>
                <View>
                    <Button
                        colour={showForward ? "primary" : "grey"}
                        startIcon="arrow-forward"
                        onPress={!showForward ? () => {} : () => setPage(page + 1)}
                    />
                </View>
            </Stack>
        </Stack>
    );
};
