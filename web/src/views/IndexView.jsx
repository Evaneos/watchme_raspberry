import { newClass } from 'esnext-class';
import View from 'turaco/lib/View';
import Fragment from 'turaco/lib/elements/Fragment';
import RasberryListComponent from './components/RasberryListComponent';
import Layout from './Layout';


export default class IndexView extends View {
    constructor() {
        super();
        this.parent = Layout;
    }

    render({ items }) {
        const listComponent = this.component(RasberryListComponent)({}, { items });

        return (
            <Fragment>
                <main>
                    { listComponent }
                </main>
            </Fragment>
        );
    }
}
