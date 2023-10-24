import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Home } from './Home';

export default function App(): JSX.Element {
    return (
        <GluestackUIProvider config={config}>
            <Home />
        </GluestackUIProvider>
    );
}
