import React from "react";
import { PageLayout } from "./lib/components/page-layout";
import { Stack } from "./lib/components/stack";
import { Alert } from "./lib/utils/theme/components/alert";
import { Button } from "./lib/utils/theme/components/button";
import { Typography } from "./lib/utils/theme/components/typography";

export type AboutProps = {};

export type AboutComponent = React.FC<AboutProps>;

const About: AboutComponent = (): JSX.Element => {
    return (
        <PageLayout title="About">
            <Stack gap="xxl">
                <Stack direction="row" style={{ marginBottom: 25 }}>
                    <Typography>If you like what I'm doing, </Typography>
                    <Button startIcon="cafe" text="you can buy me a coffee" url="https://ko-fi.com/pitilezard" />
                </Stack>
                <Typography>
                    I have been thinking about making my own logbook app for a while now, all the different tools I use
                    on either mobile or the web, they all look rather simple but wouldn't it be nice to have it all in
                    one place?
                </Typography>
                <Typography>
                    I understand that many logbook softwares exist, I've tried a few, but I'm having a go anyway, bare
                    with me ;)
                </Typography>
                <Typography>
                    Have a gander, I wouldn't mind if you gave me a quick feedback on it, even negative.
                </Typography>
                <Typography>I'm trying to keep a rough todolist here:</Typography>
                <Button text="TODOLIST" url="https://github.com/PiTiLeZarD/down-the-log/blob/master/TODO.md" />
                <Typography variant="subtitle">But I have so many more ideas and projects!</Typography>
                <Alert severity="info">
                    <Typography>
                        It is primarily a web browser tool for now, ios/android/mac/windows versions coming soon
                    </Typography>
                </Alert>
            </Stack>
        </PageLayout>
    );
};

export default About;
