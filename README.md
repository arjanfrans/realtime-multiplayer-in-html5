Realtime multiplayer in the browser
=============================

This is a fork of [realtime-multiplayer-in-html5](https://github.com/underscorediscovery/realtime-multiplayer-in-html5), the source code
that is referenced to in [this article](http://buildnewgames.com/real-time-multiplayer/).

The code is heavily refactored to separate concerns and make it easier to add functionality.

New functionality compared to the original:
* Creating, joining and leaving rooms manually.
* Support more than 2 players.
* Non in-game interface uses React.
* Login in to a given server with a name.
* Fireing of bullets.
* Player changes color when it is hit by a bullet.
* Use webpack to build the client app.

Changes compared to the original:
* Fake lag removed. (For simplicity reasons, maybe this should be added again?)
* Removed color changing.
* Removed dat.gui for setting options. Uses a React component instead.
* Moved help view to a React component. 
* Show debug stats in React component instead of in the game.

View the demo of the client [here](http://realtime-multiplayer.arjanfrans.com/). You must start a server yourself and connect to it! 

## Usage

**NOTE: Requires Node version 6 or higher.**

Run the server (will run on `http://localhost:4004`): 

```
npm start
```

Run the client (will run on `http://localhost:8080`):

```
npm run client
```

## Resources

* [realtime-multiplayer-in-html5](https://github.com/underscorediscovery/realtime-multiplayer-in-html5): The original code this project is forked from.
* [MainLoop.js](https://github.com/IceCreamYou/MainLoop.js): Included in the code to make the game loop in the right way.
