import React, { useEffect } from "react";
import { Stack } from "../../../components/stack";
import { Button } from "./button";

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
            {page > 0 && <Button colour="grey" text="Previous" onPress={() => setPage(page - 1)} />}
            {elements.slice(page * itemsPerPage, (page + 1) * itemsPerPage)}
            {page < elements.length / itemsPerPage - 1 && (
                <Button colour="grey" text="Next" onPress={() => setPage(page + 1)} />
            )}
        </Stack>
    );
};
