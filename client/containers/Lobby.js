'use strict';

const React = require('react');
const SocketClient = require('socket.io-client');
const RoomList = require('../components/RoomList');
const Game = require('../components/Game');
const clientConfig = require('./../client-config');
const gameConfig = require('../../lib/game-config');

const config = Object.assign({}, gameConfig, clientConfig);

class Lobby extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            socket: null,
            rooms: [],
            currentRoomId: null
        };
    }

    componentDidMount () {
        const socket = new SocketClient(this.props.serverUrl);

        socket.on('connect', () => {
            socket.on('onConnected', (data) => {
                this.setState({
                    socket: socket,
                    rooms: data.rooms
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
        });
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

    render () {
        return (
            <div>
                <RoomList
                    rooms={ this.state.rooms }
                    onRoomClick={ this.onJoinRoom.bind(this) }
                    onRoomCreateClick={ this.onCreateRoom.bind(this) }
                    onRoomLeaveClick={ this.onLeaveRoom.bind(this) }
                    currentRoomId={ this.state.currentRoomId }
                />
                { this.state.socket ? (
                        <Game
                            socket={ this.state.socket }
                            width={ config.world.width }
                            height={ config.world.height }
                            gameConfig={ config }
                        />
                    ) : null
                }
            </div>
        );
    }
}

Lobby.propTypes = {
    serverUrl: React.PropTypes.string.isRequired
};

module.exports = Lobby;
