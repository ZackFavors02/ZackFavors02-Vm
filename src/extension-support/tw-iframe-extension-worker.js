const source = require('./tw-load-script-as-plain-text!./tw-iframe-extension-worker-entry');

let _id = 0;

const none = "'none'";
const featurePolicy = {
    'accelerometer': none,
    'ambient-light-sensor': none,
    'autoplay': none,
    'battery': none,
    'camera': none,
    'display-capture': none,
    'document-domain': none,
    'encrypted-media': none,
    'fullscreen': none,
    'gamepad': none,
    'geolocation': none,
    'gyroscope': none,
    'magnetometer': none,
    'microphone': none,
    'midi': none,
    'payment': none,
    'picture-in-picture': none,
    'publickey-credentials-get': none,
    'speaker-selection': none,
    'usb': none,
    'vibrate': none,
    'vr': none,
    'screen-wake-lock': none,
    'web-share': none,
    'interest-cohort': none
};

const generateAllow = () => Object.entries(featurePolicy)
    .map(([name, permission]) => `${name} ${permission}`)
    .join('; ');

class IframeExtensionWorker {
    constructor () {
        this.id = _id++;
        this.isRemote = true;
        this.ready = false;
        this.queuedMessages = [];

        this.iframe = document.createElement('iframe');
        this.iframe.className = 'tw-custom-extension-frame';
        this.iframe.dataset.id = this.id;
        this.iframe.style.display = 'none';
        this.iframe.setAttribute('aria-hidden', 'true');
        this.iframe.sandbox = 'allow-scripts';
        this.iframe.allow = generateAllow();
        document.body.appendChild(this.iframe);

        window.addEventListener('message', this._onWindowMessage.bind(this));
        const blob = new Blob([
            `<body><script>window.__WRAPPED_IFRAME_ID__=${this.id};${source}</script></body>`
        ], {
            type: 'text/html'
        });
        this.iframe.src = URL.createObjectURL(blob);
    }

    _onWindowMessage (e) {
        if (!e.data || e.data.vmIframeId !== this.id) {
            return;
        }
        if (e.data.ready) {
            this.ready = true;
            for (const {data, transfer} of this.queuedMessages) {
                this.postMessage(data, transfer);
            }
            this.queuedMessages.length = 0;
        }
        if (e.data.message) {
            this.onmessage({
                data: e.data.message
            });
        }
    }

    onmessage () {
        // Should be overridden
    }

    postMessage (data, transfer) {
        if (this.ready) {
            if (transfer) {
                this.iframe.contentWindow.postMessage(data, '*', transfer);
            } else {
                this.iframe.contentWindow.postMessage(data, '*');
            }
        } else {
            this.queuedMessages.push({data, transfer});
        }
    }
}

module.exports = IframeExtensionWorker;