import View from 'turaco/lib/View';
import Fragment from 'turaco/lib/elements/Fragment';
import RaspberryListComponent from './components/RaspberryListComponent';
import Layout from './Layout';


export default class IndexView extends View {
    constructor() {
        super();
        this.parent = Layout;
    }

    render({ items }) {
        const listComponent = this.component(RaspberryListComponent)({}, { items });

        return (
            <Fragment>
                <main>
                    { listComponent }
                </main>
            </Fragment>
        );
    }
}
