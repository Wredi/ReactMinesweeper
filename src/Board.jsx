import "bootstrap/dist/css/bootstrap.min.css";
import React from 'react';
import {getRandomInt, clamp} from './utils.js';
import './Board.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import JSConfetti from 'js-confetti';

const BOMB_TYPE = 1;
const EMPTY_TYPE = 0;

const NON_VISIBLE_STATE = 0;
const VISIBLE_STATE = 1;
const FLAG_STATE = 2;

const jsConfetti = new JSConfetti();

class Board extends React.Component{
    constructor(props){
        super(props);
        this.state = this.getInitialState(props);
        
        this.restartGame = this.restartGame.bind(this);
        this.updateBoard = this.updateBoard.bind(this);
        this.showLoseModal = this.showLoseModal.bind(this);
        this.disableBoard = this.disableBoard.bind(this);
        this.showAllBombs = this.showAllBombs.bind(this);
        this.checkWin = this.checkWin.bind(this);
        this.countAdjacentBombs = this.countAdjacentBombs.bind(this);
        this.showAdjacentZeroCells = this.showAdjacentZeroCells.bind(this);
        this.generateRandomBombs = this.generateRandomBombs.bind(this);
        this.startTimer = this.startTimer.bind(this);
        this.stopTimer = this.stopTimer.bind(this);
    }
    getInitialState(props){
        let boardType = Array(props.x).fill(null).map(()=>Array(props.y).fill(EMPTY_TYPE));
        let boardState = Array(props.x).fill(null).map(()=>Array(props.y).fill(NON_VISIBLE_STATE));

        this.generateRandomBombs(boardType, props.bombCount);

        return {
            boardState: boardState,
            boardType: boardType,
            x: props.x,
            y: props.y,
            isDisabled: false,
            bombCount: props.bombCount,
            flagsCount: props.bombCount,
            wonGame: false,
            showLoseModal: false,
            elapsedTime: 0,
            countColors: [
                "#0000FF",
                "#00FF00",
                "#FF0000",
            ]
        };
    }
    restartGame(){
        this.setState(prevState => {return this.getInitialState({x: prevState.x, y: prevState.y, bombCount: prevState.bombCount})});
    }
    updateBoard(e, x, y){
        e.preventDefault();

        const boardStateCopy = this.state.boardState;

        if (this.state.elapsedTime === 0) {
            this.startTimer();
        }

        if(e.type === 'contextmenu'){
            if(boardStateCopy[x][y] === FLAG_STATE){
                boardStateCopy[x][y] = NON_VISIBLE_STATE;
            }else{
                boardStateCopy[x][y] = FLAG_STATE;
            }

            this.setState({
                boardState: boardStateCopy,
                flagsCount: this.state.flagsCount + (boardStateCopy[x][y] === 2 ? -1 : 1)
            });
        }else{
            if(boardStateCopy[x][y] === FLAG_STATE) return;

            boardStateCopy[x][y] = VISIBLE_STATE;
            const bombCount = this.countAdjacentBombs(x, y);
            if(bombCount === 0){
                let boardCopyState = this.showAdjacentZeroCells(x, y, this.state.boardState);
                this.setState({
                    boardState: boardCopyState
                });
            }

            if(this.state.boardType[x][y] === BOMB_TYPE) {
                if(this.state.isDisabled === false){
                    this.showLoseModal();
                    this.disableBoard();
                    this.showAllBombs();
                }
            }
        }

        this.checkWin();
        this.setState({
            boardState: boardStateCopy
        });
    }
    startTimer() {
        this.timer = setInterval(() => {
            this.setState(prevState => ({ elapsedTime: prevState.elapsedTime + 1 }));
        }, 1000);
    }
    stopTimer() {
        clearInterval(this.timer);
    }
    generateRandomBombs(boardType, times) {
        let bombsPlaced = 0;
        while (bombsPlaced < times) {
            let x = getRandomInt(0, boardType.length - 1);
            let y = getRandomInt(0, boardType[x].length - 1);
            if (boardType[x][y] !== BOMB_TYPE) {
                boardType[x][y] = BOMB_TYPE;
                bombsPlaced++;
            }
        }
    }
    showLoseModal() {
        this.stopTimer();
        this.setState({ showLoseModal: true });
    }
    disableBoard(){
        this.setState(prevState => {
            return {
                isDisabled: true
            }
        });
    }
    showAdjacentZeroCells(x, y, boardCopyState){
        const boardArr = this.state.boardType;

        for(let cordX = x-1; cordX <= x+1; ++cordX){
            for(let cordY = y-1; cordY <= y+1; ++cordY){
                if (cordX < 0 || cordY < 0 || cordX >= boardArr.length || cordY >= boardArr[cordX].length) {
                    continue;
                }

                if(boardCopyState[cordX][cordY]){
                    continue;
                }

                if(boardArr[cordX][cordY] === BOMB_TYPE){
                    continue;
                }
        
                if(this.countAdjacentBombs(cordX, cordY) !== 0){
                    boardCopyState[cordX][cordY] = VISIBLE_STATE;
                    continue;
                }

                boardCopyState[cordX][cordY] = VISIBLE_STATE;
                this.showAdjacentZeroCells(cordX, cordY, boardCopyState);
            }
        }
        return boardCopyState;
    }
    showAllBombs(){
        const boardStateCopy = this.state.boardState;
        for(let x = 0; x < this.state.boardState.length; ++x){
            for(let y = 0; y < this.state.boardState[x].length; ++y){
                if(this.state.boardType[x][y] === BOMB_TYPE)
                    boardStateCopy[x][y] = VISIBLE_STATE;
            }
        }
        this.setState(prevState => {
            return {
                boardState: boardStateCopy
            }
        });
    }
    countAdjacentBombs(x, y){
        let bombs = 0;
        const boardArr = this.state.boardType;
        for(let cordX = x-1; cordX <= x+1; ++cordX){
            for(let cordY = y-1; cordY <= y+1; ++cordY){
                if (cordX < 0 || cordY < 0 || cordX >= boardArr.length || cordY >= boardArr[cordX].length) {
                    continue;
                }
                bombs += (boardArr[cordX][cordY] === BOMB_TYPE ? 1 : 0);
            }
        }
        return bombs;
    }
    getCountColor(count){
        count = clamp(count - 1, 0, 2);
        return this.state.countColors[count];
    }
    checkWin() {
        for (let i = 0; i < this.state.x; i++) {
            for (let j = 0; j < this.state.y; j++) {
                if ((this.state.boardState[i][j] !== VISIBLE_STATE || this.state.boardState[i][j] === FLAG_STATE) 
                    && this.state.boardType[i][j] !== BOMB_TYPE) 
                {
                    return;
                }
            }
        }
        this.setState({ wonGame: true });
        this.showAllBombs();
        this.stopTimer();
        jsConfetti.addConfetti()
    }
    render(){
        const boardType = this.state.boardType;
        const elems = this.state.boardState.map((row, x) => {
            return row.map((cellState, y) => {
                const key = this.state.x * y + x;

                if(cellState === NON_VISIBLE_STATE) {
                    return <button className='minesweeper-button' key={key} disabled={this.state.isDisabled} 
                    onContextMenu={(e) => this.updateBoard(e, x, y)}
                    onClick={(e) => this.updateBoard(e, x, y)}></button>;
                }else if(cellState === FLAG_STATE){
                    const backgroundImage = "url('img/flag.png')";
                    return <button className='minesweeper-button' key={key} style={{backgroundImage}} 
                    onContextMenu={(e) => this.updateBoard(e, x, y)} onClick={(e) => this.updateBoard(e, x, y)}></button>;
                }

                switch(boardType[x][y]){
                    case BOMB_TYPE:
                        return <div key={key} className='cell bomb' style={{backgroundColor: "#FF0000"}}>
                            <img src="img/bomb.png" alt="bomb" />
                        </div>;
                    case EMPTY_TYPE:
                        const bombCount = this.countAdjacentBombs(x, y);
                        return (
                            <div key={key} className='cell' style={{color: this.getCountColor(bombCount)}}>
                                <p>{bombCount === 0 ? "" : bombCount}</p>
                            </div>
                        );
                    default:
                        return null;
                }
            });
        });

        return (
            <div className="main-container">
                <Modal show={this.state.wonGame} onHide={() => this.setState({ wonGame: false })}>
                    <Modal.Header closeButton className="dark">
                        <Modal.Title>Gratulacje!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="dark">
                        <div className="end-dialog">
                            <h2 style={{color: "#00FF00"}}>Wygrałeś!</h2>
                            <p>Czas gry: {this.state.elapsedTime} sekund</p>
                        </div>
                        </Modal.Body>
                    <Modal.Footer className="dark">
                        <Button variant="primary" onClick={this.restartGame}>
                        Restart
                        </Button>
                    </Modal.Footer>
                </Modal>
                
                <Modal show={this.state.showLoseModal} onHide={() => this.setState({showLoseModal: false })}>
                    <Modal.Header closeButton className="dark">
                        <Modal.Title>Game Over</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="dark">
                        <div className="end-dialog">
                            <h2 style={{color: "#FF0000"}}>Przegrałeś!</h2>
                            <p>Czas gry: {this.state.elapsedTime} sekund</p>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="dark">
                        <Button variant="primary" onClick={this.restartGame}>
                            Restart
                        </Button>
                    </Modal.Footer>
                </Modal>

                <h2>Czas gry: {this.state.elapsedTime} sekund</h2>
                <h2>Flagi: {this.state.flagsCount}</h2>
                <div className='board' style={{gridTemplateColumns: 'repeat(' + this.props.x + ',' + 64 + 'px' + ')'}}>
                    {elems}
                </div>
            </div>
        );
    }
}

export default Board;
