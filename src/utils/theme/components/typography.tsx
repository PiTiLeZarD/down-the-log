import { EM, H1, H2, H3, H4, H5, H6, P, Span } from "@expo/html-elements";
import React from "react";
import { TextStyle } from "react-native";
import { createStyleSheet, useStyles } from "../styles";

export type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "paragraph" | "subtitle" | "em";
const variantComponentMap: Record<TypographyVariant, React.ElementType> = {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    paragraph: P,
    body: Span,
    subtitle: Span,
    em: EM,
};

const stylesheet = createStyleSheet((theme) => ({
    h1: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 1.6,
        marginBottom: 18,
        marginTop: 18,
    },
    h2: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 1.5,
        marginBottom: 15,
        marginTop: 15,
    },
    h3: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 1.4,
        marginBottom: 13,
        marginTop: 13,
    },
    h4: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 1.3,
        marginBottom: 11,
        marginTop: 11,
    },
    h5: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 1.2,
        marginBottom: 9,
        marginTop: 9,
    },
    h6: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 1.1,
        marginBottom: 8,
        marginTop: 8,
    },
    body: {
        ...theme.components.typography,
    },
    paragraph: {
        ...theme.components.typography,
    },
    subtitle: {
        ...theme.components.typography,
        fontSize: theme.components.typography.fontSize * 0.9,
        color: theme.colours.grey[theme.shades.dark],
        fontStyle: "italic",
    },
    em: {
        ...theme.components.typography,
        fontStyle: "normal",
        fontWeight: "700",
    },
}));

export type TypographyProps = {
    variant?: TypographyVariant;
    style?: TextStyle;
};

export type TypographyComponent = React.FC<React.PropsWithChildren<TypographyProps>>;

export const Typography: TypographyComponent = ({ style = {}, variant = "body", children }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const Comp = variantComponentMap[variant];
    return <Comp style={[styles[variant], style]}>{children}</Comp>;
};
