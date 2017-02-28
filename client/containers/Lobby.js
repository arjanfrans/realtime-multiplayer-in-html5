'use strict';

const React = require('react');
const SocketClient = require('socket.io-client');
const RoomList = require('../components/RoomList');
const Game = require('../components/Game');
const Network = require('../game/Network');
const ClientGame = require('../game/ClientGame');
const Stats = require('../components/Stats');
const debugMode = require('../debug').debugMode;

class Lobby extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            socket: null,
            user: null,
            rooms: [],
            currentRoomId: null,
            gameClient: null
        };
    }

    componentWillMount () {
        const socket = new SocketClient(this.props.serverUrl);

        socket.binaryType = 'arraybuffer';

        socket.on('connect_error', () => {
            this.props.onLobbyError('Error connecting to server.');
            socket.close();
        });

        socket.on('connect', () => {
            socket.on('onConnected', (data) => {
                const gameClient = ClientGame.create({
                    options: this.props.gameSettings
                });

                const network = Network.create({
                    game: gameClient,
                    pingTimeout: this.props.gameSettings.pingTimeout,
                    socket
                });

                gameClient.setNetwork(network);

                this.setState({
                    user: data.user,
                    socket: socket,
                    rooms: data.rooms,
                    gameClient: gameClient
                });
            });

            socket.on('roomCreated', (data) => {
                this.setState({
                    rooms: this.state.rooms.filter(room => room.id !== data.room.id).concat(data.room)
                });
            });

            socket.on('roomDeleted', (data) => {
                this.setState({
                    rooms: this.state.rooms.filter(room => room.id !== data.roomId)
                });
            });

            socket.on('onJoinedRoom', (data) => {
                this.setState({
                    currentRoomId: data.room.id
                });
            });

            socket.on('onLeftRoom', () => {
                this.setState({
                    currentRoomId: null
                });
            });

            socket.emit('register', {
                name: this.props.name
            });
        });

        if (debugMode) {
            this.onCreateRoom();
        }
    }

    onJoinRoom (room) {
        if (this.state.socket) {
            this.state.socket.emit('joinRoom', { roomId: room.id });
        }
    }

    onLeaveRoom (roomId) {
        if (this.state.socket) {
            this.state.socket.emit('leaveRoom', { roomId: roomId });
        }
    }

    onCreateRoom () {
        if (this.state.socket) {
            this.state.socket.emit('createRoom');
        }
    }

    onLogout () {
        if (this.state.socket) {
            if (this.state.currentRoomId) {
                this.onLeaveRoom(this.state.currentRoomId);
            }

            this.state.socket.close();
        }

        this.props.logoutHandler();
    }

    render () {
        return (
            <div>
                <div className="columns">
                    <div className="single-column">
                        <div className="menu">
                            <div className="menu-heading">
                                Logged in: { this.props.name }
                                <button
                                    className="btn btn-sm btn-primary menu-btn"
                                    onClick={ this.onLogout.bind(this) }
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                        </div>
                </div>

                <div className="columns">
                    <div className="one-fourth column">
                        <RoomList
                            rooms={ this.state.rooms }
                            onRoomClick={ this.onJoinRoom.bind(this) }
                            onRoomCreateClick={ this.onCreateRoom.bind(this) }
                            onRoomLeaveClick={ this.onLeaveRoom.bind(this) }
                            currentRoomId={ this.state.currentRoomId }
                        />
                    </div>
                    <div className="three-fourths column">
                        { this.state.gameClient && this.state.currentRoomId ? (
                                    <div>
                                        <div className="text-center">
                                            <Game
                                                width={ this.props.gameSettings.world.width }
                                                height={ this.props.gameSettings.world.height }
                                                gameClient={ this.state.gameClient }
                                            />
                                        </div>
                                        <Stats
                                            game={ this.state.gameClient }
                                        />
                                    </div>
                                ) : (
                                <div className="blankslate mb-5">
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        );
    }
}

Lobby.propTypes = {
    serverUrl: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    onLobbyError: React.PropTypes.func.isRequired,
    logoutHandler: React.PropTypes.func.isRequired,
    gameSettings: React.PropTypes.object.isRequired,
};

module.exports = Lobby;
