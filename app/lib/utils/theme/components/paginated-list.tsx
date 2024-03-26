import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "../../../components/stack";
import { Button } from "./button";
import { Typography } from "./typography";

export type PaginatedListProps = {
    itemsPerPage?: number;
};

export type PaginatedListComponent = React.FC<React.PropsWithChildren<PaginatedListProps>>;

export const PaginatedList: PaginatedListComponent = ({ itemsPerPage = 10, children }): JSX.Element => {
    const elements = React.Children.toArray(children);
    const [page, setPage] = React.useState<number>(0);

    useEffect(() => setPage(0), [elements.length]);

    if (elements.length < itemsPerPage) return <>{children}</>;
    return (
        <Stack>
            {elements.slice(page * itemsPerPage, (page + 1) * itemsPerPage)}
            <Stack direction="row">
                <View>
                    <Button
                        colour={page > 0 ? "primary" : "grey"}
                        startIcon="arrow-back"
                        onPress={() => setPage(page - 1)}
                    />
                </View>
                <Typography style={{ flexGrow: 1, textAlign: "center" }}>
                    {page + 1} / {Math.ceil(elements.length / itemsPerPage)}
                </Typography>
                <View>
                    <Button
                        colour={page < elements.length / itemsPerPage - 1 ? "primary" : "grey"}
                        startIcon="arrow-forward"
                        onPress={() => setPage(page + 1)}
                    />
                </View>
            </Stack>
        </Stack>
    );
};
