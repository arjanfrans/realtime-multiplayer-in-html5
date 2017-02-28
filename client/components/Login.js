'use strict';

const React = require('react');

class Login extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            server: 'http://localhost:4004',
            name: ''
        };
    }

    handleValueChange (event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render () {
        return (
            <div className="one-fourth column centered">
                <div className="menu">
                    <div className="menu-heading">
                        Login to server
                    </div>
                    <form
                        className="mr-3 ml-3 mb-3"
                        onSubmit={ (event) => {
                            event.preventDefault();

                            this.props.submitHandler(this.state);
                        } }
                    >
                        <dl className="form-group">
                            <dt><label>Name</label></dt>
                            <dd>
                                <input
                                    className="form-control"
                                    type="text"
                                    name="name"
                                    required={ true }
                                    minLength={ 1 }
                                    value={ this.state.name }
                                    onChange={ this.handleValueChange.bind(this) }
                                />
                            </dd>
                        </dl>

                        <dl className="form-group">
                            <dt><label>Server url</label></dt>
                            <dd>
                                <input
                                    className="form-control"
                                    type="text"
                                    name="server"
                                    required={ true }
                                    minLength={ 1 }
                                    value={ this.state.server }
                                    onChange={ this.handleValueChange.bind(this) }
                                />
                            </dd>
                        </dl>

                        <div className="form-actions">
                            <input
                                className="btn btn-primary"
                                type="submit"
                                value="Login"
                            />
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

Login.propTypes = {
    submitHandler: React.PropTypes.func.isRequired
};

module.exports = Login;
