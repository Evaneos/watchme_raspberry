import TopLayout from 'turaco/lib/TopLayout';

export default class Layout extends TopLayout {
    head() {
        return `
<title>Raspberries</title>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">

<!--Polyfills-->
<script>
  'article aside footer header nav section time main'.replace(/\w+/g,function(n){document.createElement(n)})
</script>
<script src="//cdn.polyfill.io/v1/polyfill.min.js?features=all"></script>

<!--Import style -->
<link href='http://fonts.googleapis.com/css?family=Roboto:400,700,500,300,100,500italic,400italic,700italic' rel='stylesheet' type='text/css'>
<link type="text/css" rel="stylesheet" href="/index.css"  media="screen,projection"/>

<!--Let browser know website is optimized for mobile-->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>

<script src="/jspm_packages/system.js"></script>
<script src="/config.js"></script>

<script>
    System.import('js/main.js');
</script>
        `;
    }

    body($body, data) {
        const $container = $.create('div').setAttribute('class', 'container-page').appendTo($body);
        this.$content = $container;

        this.$content.append(`
            <script>window.webSocketPort = ${ data.webSocketPort }</script>
            <script type="text/javascript" src="//${ data.hostname }:${ data.webSocketPort }/socket.io/socket.io.js">
            </script>`);
    }
}
