import Component from 'turaco/lib/Component';
import Fragment from 'turaco/lib/elements/Fragment';

export default class RasberryComponent extends Component {
    constructor() {
        super();
        this.elements = [
            'name',
            'status',
            'inputUrl',
            'save',
            'refresh',
        ];
    }

    init({ rasberryId }) {
        this.rasberryId = rasberryId;
    }

    create() {
        this.$name = <span></span>;
        this.$status = <span></span>;
        this.$inputUrl = <input type="url" required onkeyup="this.setAttribute('value', this.value);"></input>;
        this.$save = <button type="button">Save</button>;
        this.$refresh = <button type="button">Refresh page on screen</button>;
    }

    render({ rasberry }) {
        this.$name.text(rasberry.name);
        this.$inputUrl.setAttribute('id', 'rasberry-url-' + this.rasberryId).setAttribute('value', rasberry.url);
        this[rasberry.online ? 'online' : 'offline']();

        return (
            <Fragment>
                { this.$name } { this.$status } <span class="text-caption">{ rasberry.mac }</span>

                <div class="input text">
                    { this.$inputUrl }
                    <label for={ 'rasberry-url-' + this.rasberryId }>URL</label>
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
            fetch('/save?id=' + encodeURIComponent(this.rasberryId) + '&url=' + encodeURIComponent(this.$inputUrl.getValue()))
                .then(() => {
                }).catch((err) => {
                    alert(err);
                }).then(() => {
                    this.$save.removeClass('disabled').setProperty('disabled', false);
                });
        });

        this.$refresh.on('click', () => {
            this.$refresh.addClass('disabled').setProperty('disabled', true);
            fetch('/refresh?id=' + encodeURIComponent(this.rasberryId))
                .then(() => {
                }).catch((err) => {
                    alert(err);
                }).then(() => {
                    this.$refresh.removeClass('disabled').setProperty('disabled', false);
                });
        });
    }

    online() {
        this.$refresh.show();
        this.$status.html('<span class="label success">Online</span>');
    }

    offline() {
        this.$refresh.hide();
        this.$status.html('<span class="label warning">Offline</span>');
    }
}
