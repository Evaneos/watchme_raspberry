import Component from 'turaco/lib/Component';
import RasberryComponent from './RasberryComponent';

export default class RasberryListComponent extends Component {
    render({ items }) {
        const $list = <ul id="rasberry-list" class="rasberry-list list"></ul>;
        const Rasberry = this.component(RasberryComponent);

        items.forEach((rasberry) => {
            $list.append(<Rasberry rasberryId={ rasberry.id } data={ { rasberry } }></Rasberry>);
        });

        return $list;
    }
}
