import Component from 'turaco/lib/Component';
import Fragment from 'turaco/lib/elements/Fragment';
// import { emit } from '../../browser/webSocket';

export default class RaspberryComponent extends Component {
    constructor() {
        super();
        this.elements = [
            'name',
            'status',
            'ip',
            'inputUrl',
            'save',
            'refresh',
        ];
    }

    init({ raspberryId }) {
        this.raspberryId = raspberryId;
    }

    create() {
        this.$name = <span></span>;
        this.$status = <span></span>;
        this.$ip = <span class="text-caption label"></span>;
        this.$inputUrl = <input type="url" required onkeyup="this.setAttribute('value', this.value);"></input>;
        this.$save = <button type="button">Save</button>;
        this.$refresh = <button type="button">Refresh page on screen</button>;
    }

    render({ raspberry }) {
        this.$container.setAttribute('data-raspberry-id', this.raspberryId);
        this.$name.text(raspberry.name);
        this.$inputUrl.setAttribute('id', 'raspberry-url-' + this.raspberryId).setAttribute('value', raspberry.url);
        this[raspberry.online ? 'online' : 'offline'](raspberry.online && raspberry.ip);

        return (
            <Fragment>
                { this.$name } { this.$status } <span class="text-caption">{ raspberry.mac }</span> { this.$ip }

                <div class="input text">
                    { this.$inputUrl }
                    <label for={ 'raspberry-url-' + this.raspberryId }>URL</label>
                </div>

                <div class="button-container" style="margin-top: 20px">
                    { this.$save } { this.$refresh }
                </div>
            </Fragment>
        );
    }

    ready() {
        this.$save.on('click', () => {
            this.$save.addClass('disabled').setProperty('disabled', true);
            webSocket.emit('save', this.raspberryId, this.$inputUrl.getValue())
                .catch(err => alert(err))
                .then(() => {
                    this.$save.removeClass('disabled').setProperty('disabled', false);
                });
        });

        this.$refresh.on('click', () => {
            this.$refresh.addClass('disabled').setProperty('disabled', true);
            webSocket.emit('refresh', this.raspberryId)
                .catch(err => alert(err))
                .then(() => {
                    this.$refresh.removeClass('disabled').setProperty('disabled', false);
                });
        });
    }

    setUrl(url) {
        this.$inputUrl.setValue(url);
    }

    online(ip) {
        this.$ip.text(ip);
        this.$refresh.show();
        this.$status.html('<span class="label success">Online</span>');
    }

    offline() {
        this.$ip.text('');
        this.$refresh.hide();
        this.$status.html('<span class="label warning">Offline</span>');
    }
}
