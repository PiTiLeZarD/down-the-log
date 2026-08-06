import React, { PropsWithChildren } from "react";
import { View } from "react-native";
import { Stack } from "../../../components/stack";
import { Button } from "./button";
import { Typography } from "./typography";

export type PaginatedListProps = PropsWithChildren<{
    itemsPerPage?: number;
    whenEmpty?: React.ReactNode;
}>;

export const PaginatedList = ({ itemsPerPage = 10, whenEmpty, children }: PaginatedListProps) => {
    const elements = React.Children.toArray(children);
    const [page, setPage] = React.useState<number>(0);

    // Back to the first page whenever the list itself changes. Adjusting state during render is the
    // supported way to do this, an effect would render the stale page first.
    const [renderedFor, setRenderedFor] = React.useState<number>(elements.length);
    if (renderedFor !== elements.length) {
        setRenderedFor(elements.length);
        setPage(0);
    }

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
