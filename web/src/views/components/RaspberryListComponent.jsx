import Component from 'turaco/lib/Component';
import RaspberryComponent from './RaspberryComponent';

export default class RaspberryListComponent extends Component {
    render({ items }) {
        const $list = <ul id="raspberry-list" class="raspberry-list list"></ul>;
        const Raspberry = this.component(RaspberryComponent);

        items.forEach((raspberry) => {
            $list.append(<Raspberry raspberryId={ raspberry.id } data={ { raspberry } }></Raspberry>);
        });

        return $list;
    }

    ready() {
        webSocket.on('saved', (raspberryId, url) => {
            const $item = this.$container.findFirst(`[data-raspberry-id=${raspberryId}]`);
            if ($item) {
                const component = $item._component;
                component.setUrl(url);
            }
        });

        webSocket.on('online', (raspberryId, ip) => {
            const $item = this.$container.findFirst(`[data-raspberry-id=${raspberryId}]`);
            if ($item) {
                const component = $item._component;
                component.online(ip);
            }
        });

        webSocket.on('offline', (raspberryId) => {
            const $item = this.$container.findFirst(`[data-raspberry-id=${raspberryId}]`);
            if ($item) {
                const component = $item._component;
                component.offline();
            }
        });
    }
}
