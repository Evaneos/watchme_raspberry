import React, { Component, PropTypes } from 'react';

export default class ScreenPage extends Component {
    static contextTypes = {
        onSetTitle: PropTypes.func.isRequired,
    };

    render() {
        const title = 'Scren Test !';
        this.context.onSetTitle(title);
        return (
            <div>
            </div>
        );
    }

}
