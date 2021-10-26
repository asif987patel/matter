
//initializing the constants and engine from the matter libarary
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth - 5; //the actual width of the part where matter will render it's engine
const height = window.innerHeight - 5; //the actual height of the part where matter will render it's engine
let cellsWidth = 10;  //the thickness of the lines
let cellsHorizontal = 5; //amount of columns at start
let cellsVertical = 5; //amount of rows at start
let speedlimit = 15; //speedlimit of ball
let unitLengthX = width / cellsHorizontal; //calculating the width of one cell(section or box)
let unitLengthY = height / cellsVertical; //calculating the height of one cell(section or box)
let level = 1 //the current level
let is_in_phone_mode = 0;
let ghost_speed = 30;
let can_teleport = true;

const engine = Engine.create(); //creating the engine for all the matter to work
engine.world.gravity.y = 0; //setting the gravity to 0 so everything doesn't fall down
const { world } = engine; //getting the world variable from the engine

//creating the render object on the body tag of HTML file with dimentions
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render); //start the rendering to show the world in HTML file
Runner.run(Runner.create(), engine); //attaching the engine with rendered world


//creating the array of the walls(rectangles) that cover the world
// Bodies.rectangle(
//     "x-position of this object",
//     "y-position of this object",
//     "width of this object",
//     "height of this object",
//     "any other options you want to add"
// ),
const walls = [
    Bodies.rectangle(width / 2, 0, width, 10, { isStatic: true }), //upper wall
    Bodies.rectangle(width / 2, height, width, 10, { isStatic: true }), //lower wall
    Bodies.rectangle(0, height / 2, 10, height, { isStatic: true }), //wall at left side
    Bodies.rectangle(width, height / 2, 10, height, { isStatic: true }), //wall at right side
];
World.add(world, walls); //adding the wall array to world so it shows on HTML file

//maze generation

//function to shuffle the array 
const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
}

//array that store the data of visited/unvisited cells
let grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

//array that stores the data of vertical lines/blocks/rectangles 
let verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));


//array that stores the data of horizontal lines/block/rectangle
let horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

//function to get the number of rows that the given object is in
const getRow = (object) => {
    return (parseInt(object.position.y / unitLengthY));
}
//function to get the number of columns that the given object is in
const getColumn = (object) => {
    return (parseInt(object.position.x / unitLengthX));
}

//function to set the number of rows that the given object is in
const setRow = (object, row) => {
    if (row >= 0 && row < cellsVertical) {
        Body.setPosition(object, { x: object.position.x, y: ((unitLengthY * (row + 1)) - (unitLengthY / 2)) });
    } else {
        throw new Error('out of bound');
    }
}
//function to set the number of columns that the given object is in
const setColumn = (object, column) => {
    if (column >= 0 && column < cellsHorizontal) {
        Body.setPosition(object, { x: ((unitLengthX * (column + 1)) - (unitLengthX / 2)), y: object.position.y });
    } else {
        throw new Error('out of bound');
    }
}
//change position of any object in maze
const changePosition = (object, row, column) => {
    if (column >= 0 && column < cellsHorizontal && row >= 0 && row < cellsVertical) {
        Body.setPosition(object, { x: ((unitLengthX * (column + 1)) - (unitLengthX / 2)), y: ((unitLengthY * (row + 1)) - (unitLengthY / 2)) });
    } else {
        throw new Error('out of bound');
    }
}



//function that goes throw each and every cells in maze and also update the arrays
const stepThroughCell = (row, column) => {
    //if cell is already visited, no need to do anything else
    if (grid[row][column]) {
        return;
    } else {
        //if cell is not visited, mark it visited first
        grid[row][column] = true;

        //creat the array of that cell's neighbor cells and shuffle them to randomly go throw each one
        const neighbors = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left']
        ]);

        //go throw each neighbor cell and repeat the process until every cell gets visited
        for (let neighbor of neighbors) {
            //getting the neighbor's row-column-direction to use in algorithm
            const [nextRow, nextColumn, direction] = neighbor;

            //check if neigbour cell is out of bounds (if it is, just skip that cell)     
            if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
                continue;
            }

            //check if this cell is already visited (if it is, just skip that cell)
            if (grid[nextRow][nextColumn]) {
                continue;
            }


            /*
            if cells not out of bound and not visited, 
            then we can remove the wall/block/rectangle between that 2 cells
            */
            if (direction === 'left') {  //checking the direction to make sure which wall to remove
                verticals[row][column - 1] = true;
            } else if (direction === 'right') {
                verticals[row][column] = true;
            }
            if (direction === 'up') {
                horizontals[row - 1][column] = true;
            } else if (direction === 'down') {
                horizontals[row][column] = true;
            }

            //calling that method again to repeat the same process for this cell(neighbor)
            stepThroughCell(nextRow, nextColumn);
        }
    }
};

//randomly selecting one cell to start generating maze
let startRow = Math.floor(Math.random() * cellsVertical);
let startColumn = Math.floor(Math.random() * cellsHorizontal)


//starting the maze generation algorithm by calling this function
stepThroughCell(startRow, startColumn);


//making the function to create the maze with arrays using matter.js
const createMaze = () => {

    /*
    going throw horizontal array to put 
    block/wall/rectangle according to array's data
    */
    horizontals.forEach((row, rowIndex,) => {
        row.forEach((open, columnIndex) => {
            /*
            if the array's value is true, that means there are no wall at that point
            so, we don't need to add wall here, simply return
            */
            if (open) {
                return;
            } else {
                /*
                if the array's value is false, that means there are wall at that point
                so, we need to add wall here, first create that wall(rectangle)
                */
                const wall = Bodies.rectangle(
                    columnIndex * unitLengthX + (unitLengthX / 2), //calculating the center x-point of that rectangle
                    ((rowIndex + 1) * unitLengthY) - 5, //calculation the center y-point of that rectangle
                    unitLengthX + 10, //width of that rectangle will be unit lenght of x(because it's horizontal)
                    cellsWidth, //height(thickness) of that rectangle 
                    {
                        label: 'wall',  //labeling the rectangle as wall
                        isStatic: true, //making the wall static so it does't get effected by gravity
                        render: {
                            fillStyle: 'white'  //giving the color to wall
                        }
                    }
                );
                World.add(world, wall); //adding the created rectangle into the world
            }
        })
    });

    /*
    going throw verticals array to put 
    block/wall/rectangle according to array's data
    */
    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            /*
            if the array's value is true, that means there are no wall at that point
            so, we don't need to add wall here, simply return
            */
            if (open) {
                return;
            }
            const wall = Bodies.rectangle(
                (columnIndex + 1) * unitLengthX, //calculating the center x-point of that rectangle
                rowIndex * unitLengthY + (unitLengthY / 2), //calculation the center y-point of that rectangle
                cellsWidth, //width(thickness) of that rectangle 
                unitLengthY, //height of that rectangle will be unit lenght of y(because it's vertical)
                {
                    label: 'wall', //labeling the rectangle as wall
                    isStatic: true, //making the wall static so it does't get effected by gravity
                    render: {
                        fillStyle: 'white' //giving the color to wall
                    }
                }
            );
            World.add(world, wall); //adding the created rectangle into the world
        })
    });

}

//calling the function to creat the maze according to array's data
createMaze();


//creating the goal to finish the game
let goal = Bodies.rectangle(
    width - (unitLengthX / 2), //calculating center x-point of the goal so it will be at bottom
    height - (unitLengthY / 2), //calculating center y-point of the goal so it will be at bottom
    unitLengthX * 0.6, //width of the goal block
    unitLengthY * 0.6, //height of the goal block
    {
        isStatic: true, //making it static so gravity doesn't effect it
        label: 'goal', //labeling it as a goal
        render: {
            fillStyle: 'green' //giving it a color
        }
    }
);
World.add(world, goal); //adding the goal to the world

//creating the ball to start the game
let ballRadius = Math.min(unitLengthX, unitLengthY) * 0.2; //calculating the radius of the ball so it will always fit in the game
let ball = Bodies.circle(
    unitLengthX / 2, //center x-point of the ball so it will be at top
    unitLengthY / 2, //center y-point of the ball so it will be at top
    ballRadius, //radius of the ball
    {
        label: 'ball', //labeling it as ball
        render: {
            fillStyle: 'blue' //giving it color
        }
    }
);
World.add(world, ball); //adding the ball to the world

//creating the ghost to follow the ball
let ghostRadius = Math.min(unitLengthX, unitLengthY) * 0.2; //calculating the radius of the ghost so it will always fit in the game
let ghost = Bodies.circle(
    (unitLengthX * cellsHorizontal) - (unitLengthX / 2), //center x-point of the ghost so it will be at top
    unitLengthY / 2, //center y-point of the ghost so it will be at top
    ghostRadius, //radius of the ghost
    {
        label: 'ghost', //labeling it as ghost
        render: {
            fillStyle: 'red' //giving it color
        }
    }
);
World.add(world, ghost); //adding the ghost to the world

//ball controls (for phone and PC)
var w = window.innerWidth;
var h = window.innerHeight;

if (w <= 500 && h <= 800) {
    console.log("phone mode is on");
    is_in_phone_mode = 1;
    let acl = new Accelerometer({ frequency: 60 });
    acl.start();
    let p = document.getElementById('test');
    setInterval(function () {
        // console.log("Acceleration along the X-axis " + acl.x);
        // p.innerHTML = "the x is " + acl.x + "<br>" + "the y is " + acl.y + "<br>" + "the z is " + acl.z;
        const { x, y } = ball.velocity;
        let speedx = Math.ceil(acl.x);
        let speedy = Math.ceil(acl.y);
        let rate = 0.7;
        //up
        if (speedy <= -1) {
            if (y < -speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x, y: y - (Math.abs(speedy) * rate) });
            }
        }
        //down
        if (speedy > 1) {
            if (y > speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x, y: y + (Math.abs(speedy) * rate) });
            }
        }
        //left
        if (speedx > 1) {
            if (x < -speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x: x - (Math.abs(speedx) * rate), y });
            }
        }
        //right
        if (speedx < -1) {
            if (x > speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x: x + (Math.abs(speedx) * rate), y });
            }
        }

    }, 100);
} else {
    console.log("PC mode is on");
    var keyState = {};
    document.addEventListener('keydown', function (e) {
        keyState[e.key] = true;
        if (e.code == 'Space') {
            teleportBall();
        }
    });
    document.addEventListener('keyup', function (e) {
        keyState[e.key] = false;
    });
    setInterval(function () {
        const { x, y } = ball.velocity;
        if (keyState['w'] || keyState['ArrowUp']) {
            if (y < -speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x, y: y - 3 });
            }
        }
        if (keyState['s'] || keyState['ArrowDown']) {
            if (y > speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x, y: y + 3 });
            }
        }
        if (keyState['a'] || keyState['ArrowLeft']) {
            if (x < -speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x: x - 3, y });
            }
        }
        if (keyState['d'] || keyState['ArrowRight']) {
            if (x > speedlimit) {
                //
            } else {
                Body.setVelocity(ball, { x: x + 3, y });
            }
        }
    }, 100);
}

//win condition
let is_won = false;
let is_lose = false;
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const win_labels = ['ball', 'goal'];
        const lose_labels = ['ball', 'ghost'];
        //win condition
        if (win_labels.includes(collision.bodyA.label) && win_labels.includes(collision.bodyB.label)) {
            if (!is_lose) {
                is_won = true;
                if (cellsHorizontal >= 20 || cellsVertical >= 20) {
                    document.querySelector("#next").remove();
                }
                if (is_autoplay_on) {
                    autoplayOff();
                }
                ghostplayOff();
                document.querySelector('.winner').classList.remove('hidden');
                document.addEventListener('keypress', enterEvent);
                // world.gravity.y = 1;
                world.bodies.forEach(body => {
                    if (body.label === 'wall') {
                        Body.setStatic(body, false);
                    }
                });
            }
        }
        if (lose_labels.includes(collision.bodyA.label) && lose_labels.includes(collision.bodyB.label)) {

            console.log(is_won);
            if (!is_won) {
                is_lose = true;
                if (is_autoplay_on) {
                    autoplayOff();
                }
                // ghostplayOff();
                document.querySelector('.losser').classList.remove('hidden');
                document.addEventListener('keypress', enterEvent);
                // world.gravity.y = 1;
                world.bodies.forEach(body => {
                    if (body.label === 'wall') {
                        Body.setStatic(body, false);
                    }
                });
            }

        }
    });
});
function enterEvent(event) {
    if (['Enter', ' '].includes(event.key)) {
        document.removeEventListener('keypress', enterEvent);
        nextLevel();
    }
}

//next Level
const nextLevel = () => {

    is_lose = false;
    is_won = false;
    ghostplayOff();
    if (level >= 20) {
        console.log("no more level nor now");
    } else {
        let out = [];

        //removing the win tag
        document.querySelector('.winner').classList.add('hidden');

        world.bodies.forEach(body => {
            if (body.label === 'wall') {
                out.push(body);
            }
        });

        //removing the old maze
        out.forEach((body) => {
            World.remove(world, body);
        });
        World.remove(world, ball);
        World.remove(world, goal);
        World.remove(world, ghost);

        cheatOff();

        //updating the data for next level

        engine.world.gravity.y = 0;

        cellsHorizontal = cellsHorizontal + 1;
        cellsVertical = cellsVertical + 1;
        if (cellsWidth <= 1) {
            cellsWidth = 1;
        } else {
            cellsWidth = cellsWidth - 1;
        }
        if (speedlimit <= 4) {
            speedlimit = 4;
        } else {
            speedlimit = speedlimit - 1;
        }
        if (ghost_speed > 5) {
            ghost_speed = ghost_speed - 5;
        }

        unitLengthX = width / cellsHorizontal;
        unitLengthY = height / cellsVertical;

        grid = Array(cellsVertical)
            .fill(null)
            .map(() => Array(cellsHorizontal).fill(false));

        verticals = Array(cellsVertical)
            .fill(null)
            .map(() => Array(cellsHorizontal - 1).fill(false));

        horizontals = Array(cellsVertical - 1)
            .fill(null)
            .map(() => Array(cellsHorizontal).fill(false));

        startRow = Math.floor(Math.random() * cellsVertical);
        startColumn = Math.floor(Math.random() * cellsHorizontal)

        stepThroughCell(startRow, startColumn);
        createMaze();

        ballRadius = Math.min(unitLengthX, unitLengthY) * 0.2;
        ball = Bodies.circle(
            unitLengthX / 2,
            unitLengthY / 2,
            ballRadius,
            {
                label: 'ball',
                render: {
                    fillStyle: 'blue'
                }
            }
        );
        World.add(world, ball);

        ghostRadius = Math.min(unitLengthX, unitLengthY) * 0.2; //calculating the radius of the ghost so it will always fit in the game
        ghost = Bodies.circle(
            (unitLengthX * cellsHorizontal) - (unitLengthX / 2), //center x-point of the ghost so it will be at top
            unitLengthY / 2,
            ghostRadius, //radius of the ghost
            {
                label: 'ghost', //labeling it as ghost
                render: {
                    fillStyle: 'red' //giving it color
                }
            }
        );
        World.add(world, ghost);


        goal = Bodies.rectangle(
            width - (unitLengthX / 2),
            height - (unitLengthY / 2),
            unitLengthX * 0.6,
            unitLengthY * 0.6,
            {
                isStatic: true,
                label: 'goal',
                render: {
                    fillStyle: 'green'
                }
            }
        );
        World.add(world, goal);
        level++;
        ghostPlayOn();
    }
}

let cheatGrid;
let lVerticals;
let lHorizontals;

let is_win = 0;

const cheatOn = () => {
    document.querySelector('#cheaton').classList.add('hidden');
    document.querySelector('#cheatoff').classList.remove('hidden');

    is_win = 0;
    cheatGrid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));
    lVerticals = Array(cellsVertical - 1)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(true));
    lHorizontals = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal - 1).fill(true));
    solve(getRow(ball), getColumn(ball));
    createLine();
}
let is_autoplay_done = 0;
let is_autoplay_on = 0;
let auto_play_id;
const autoplayOn = () => {
    is_autoplay_on = 1;
    document.querySelector('#autoplayon').classList.add('hidden');
    document.querySelector('#autoplayoff').classList.remove('hidden');

    let timer = is_in_phone_mode ? 100 : 1;
    is_autoplay_done = 0;
    auto_play_id = setInterval(function () {
        autoPlay();
    }, timer);
}
let ghost_play_id;
const ghostPlayOn = () => {
    document.querySelector('#ghostplayon').classList.add('hidden');
    document.querySelector('#ghostplayoff').classList.remove('hidden');
    World.remove(world, ghost);
    ghostRadius = Math.min(unitLengthX, unitLengthY) * 0.2; //calculating the radius of the ghost so it will always fit in the game
    ghost = Bodies.circle(
        (unitLengthX * cellsHorizontal) - (unitLengthX / 2), //center x-point of the ghost so it will be at top
        unitLengthY / 2,
        ghostRadius, //radius of the ghost
        {
            label: 'ghost', //labeling it as ghost
            render: {
                fillStyle: 'red' //giving it color
            }
        }
    );
    World.add(world, ghost);
    setTimeout(function () {
        let ghostTimer = ghost_speed * 10;
        ghost_play_id = setInterval(function () {
            ghostAutoPlay();
        }, ghostTimer);
    }, 3000);
}
const ghostplayOff = () => {
    document.querySelector('#ghostplayoff').classList.add('hidden');
    document.querySelector('#ghostplayon').classList.remove('hidden');
    clearInterval(ghost_play_id);
    World.remove(world, ghost);
}
const autoplayOff = () => {
    document.querySelector('#autoplayoff').classList.add('hidden');
    document.querySelector('#autoplayon').classList.remove('hidden');
    if (is_autoplay_on) {
        is_autoplay_on = 0;
        clearInterval(auto_play_id);
    }
}
const createLine = () => {
    lHorizontals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }
            const line = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + (unitLengthY / 2),
                unitLengthX,
                3,
                {
                    label: 'line',
                    isStatic: true,
                    render: {
                        fillStyle: 'green'
                    },
                    collisionFilter: {
                        group: -1,
                        category: 2,
                        mask: 0
                    }
                }
            );
            World.add(world, line);
        })
    });

    lVerticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }
            const line = Bodies.rectangle(
                columnIndex * unitLengthX + (unitLengthX / 2),
                rowIndex * unitLengthY + unitLengthY,
                3,
                unitLengthY,
                {
                    label: 'line',
                    isStatic: true,
                    render: {
                        fillStyle: 'green'
                    },
                    collisionFilter: {
                        group: -1,
                        category: 2,
                        mask: 0
                    }
                }
            );
            World.add(world, line);
        })
    })

}
const solve = (row, column) => {
    //check if node we are on is already in array path or we reach to goal
    if (cheatGrid[cellsHorizontal - 1][cellsVertical - 1]) {
        if (is_win) {
            is_win = 1;
            return 1;
        }
    }
    if (cheatGrid[row][column] || cheatGrid[cellsHorizontal - 1][cellsVertical - 1]) {
        return 0;
    }

    //making node visited to puch in array soon
    cheatGrid[row][column] = true;

    //assemble list of neighbour
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    //for each neighbour
    for (let neighbor of neighbors) {
        //see if neigbour is out of bounds
        const [nextRow, nextColumn, direction] = neighbor;
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }

        //if we visited neigbour, contunie checking
        if (cheatGrid[nextRow][nextColumn]) {
            continue;
        }

        //chek if there is wall between 2 node
        if (direction === 'up') {
            if (horizontals[row - 1][column]) {
                lVerticals[row - 1][column] = false;
            } else {
                continue;
            }
        }
        if (direction === 'down') {
            if (horizontals[row][column]) {
                lVerticals[row][column] = false;
            } else {
                continue;
            }
        }
        if (direction === 'left') {
            if (verticals[row][column - 1]) {
                lHorizontals[row][column - 1] = false;
            } else {
                continue;
            }
        }
        if (direction === 'right') {
            if (verticals[row][column]) {
                lHorizontals[row][column] = false;
            } else {
                continue;
            }
        }
        should_stay = solve(nextRow, nextColumn);
        if (cheatGrid[cellsHorizontal - 1][cellsVertical - 1] && should_stay) {

        } else {
            if (direction === 'up') {
                if (horizontals[row - 1][column]) {
                    lVerticals[row - 1][column] = true;
                }
            }
            if (direction === 'down') {
                if (horizontals[row][column]) {
                    lVerticals[row][column] = true;
                }
            }
            if (direction === 'left') {
                if (verticals[row][column - 1]) {
                    lHorizontals[row][column - 1] = true;
                }
            }
            if (direction === 'right') {
                if (verticals[row][column]) {
                    lHorizontals[row][column] = true;
                }
            }
        }


    }
    return 1;
}
let off = [];
const cheatOff = () => {
    document.querySelector('#cheaton').classList.remove('hidden');
    document.querySelector('#cheatoff').classList.add('hidden');
    world.bodies.forEach(body => {
        if (body.label === 'line') {
            off.push(body);
        }
    });
    off.forEach((body) => {
        World.remove(world, body);
    });
}



const ghostAutoPlay = () => {
    ghostPlayVisitedGrid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    ghostPlayPathGrid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));
    autoSolve(
        getRow(ghost),//starting row
        getColumn(ghost),//starting column
        getRow(ball), //finishing row
        getColumn(ball), //finishing columns
        ghostPlayVisitedGrid,//array to keep track of visited nodes
        ghostPlayPathGrid,//array to store the final path
        0,//boll to show is task done
    );
    ghostPlayPathGrid[getRow(ghost)][getColumn(ghost)] = true;

    autoMoveObject(ghost, ghostPlayPathGrid, [getRow(ball), getColumn(ball)]);
}
//function to autocomplete the game
const autoPlay = () => {
    is_autoplay_done = 0;
    autoPlayVisitedGrid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    autoPlayPathGrid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));
    autoSolve(
        getRow(ball),//starting row
        getColumn(ball),//starting column
        cellsHorizontal - 1, //finishing row
        cellsVertical - 1, //finishing columns
        autoPlayVisitedGrid,//array to keep track of visited nodes
        autoPlayPathGrid,//array to store the final path
        is_autoplay_done,//boll to show is task done
    );
    autoPlayPathGrid[getRow(ball)][getColumn(ball)] = true;

    autoMoveObject(ball, autoPlayPathGrid, [cellsHorizontal - 1, cellsVertical - 1]);
}
const autoSolve = (row, column, finishRow, finishColumn, visitedGrid, pathGrid, is_done) => {

    //check if node we are on is already in array path or we reach to goal
    if (visitedGrid[finishRow][finishColumn]) {
        if (!is_done) {
            is_done = 1;
            return 0;
        }
        return 0;
    }
    if (visitedGrid[row][column]) {
        return 0;
    }
    //making node visited to puch in array soon
    visitedGrid[row][column] = true;


    //assemble list of neighbour
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    //for each neighbour
    for (let neighbor of neighbors) {
        //see if neigbour is out of bounds
        const [nextRow, nextColumn, direction] = neighbor;
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }

        //if we visited neigbour, contunie checking
        if (visitedGrid[nextRow][nextColumn]) {
            continue;
        }

        //chek if there is wall between 2 node
        if (direction === 'up') {
            if (horizontals[row - 1][column]) {
                pathGrid[row - 1][column] = true;
            } else {
                continue;
            }
        }
        if (direction === 'down') {
            if (horizontals[row][column]) {
                pathGrid[row + 1][column] = true;
            } else {
                continue;
            }
        }
        if (direction === 'left') {
            if (verticals[row][column - 1]) {
                pathGrid[row][column - 1] = true;
            } else {
                continue;
            }
        }
        if (direction === 'right') {
            if (verticals[row][column]) {
                pathGrid[row][column + 1] = true;
            } else {
                continue;
            }
        }
        should_stay = autoSolve(nextRow, nextColumn, finishRow, finishColumn, visitedGrid, pathGrid, is_done);
        if (pathGrid[finishRow][finishColumn] && should_stay) {

        } else {
            if (direction === 'up') {
                if (horizontals[row - 1][column]) {
                    pathGrid[row - 1][column] = false;
                }
            }
            if (direction === 'down') {
                if (horizontals[row][column]) {
                    pathGrid[row + 1][column] = false;
                }
            }
            if (direction === 'left') {
                if (verticals[row][column - 1]) {
                    pathGrid[row][column - 1] = false;
                }
            }
            if (direction === 'right') {
                if (verticals[row][column]) {
                    pathGrid[row][column + 1] = false;
                }
            }
        }
    }
    return 1;
}

const autoMoveObject = (object, pathGrid, target) => {
    objectVisitedGrid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));
    let targetRow = target[0];
    let targetColumn = target[1];
    let row, column;
    let is_target_reached = 0;
    let neighbors;
    let interval = 0;
    while (!is_target_reached && interval < 10) {
        let { x, y } = object.velocity;
        row = getRow(object);
        column = getColumn(object);
        objectVisitedGrid[row, column] = true;

        //assemble list of neighbour
        neighbors = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left']
        ]);

        //for each neighbour
        for (let neighbor of neighbors) {
            interval++;
            //see if neigbour is out of bounds
            const [nextRow, nextColumn, direction] = neighbor;
            if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
                continue;
            }

            //if we visited neigbour, contunie checking
            if (objectVisitedGrid[nextRow][nextColumn]) {
                continue;
            }

            //check in path grid that should we go to that neighbor
            if (!pathGrid[nextRow][nextColumn]) {
                continue;
            }

            //check if there is wall between 2 node
            if (direction === 'up') {
                if (horizontals[row - 1][column]) {
                    if (y < -speedlimit) {
                        //
                    } else {
                        Body.setVelocity(object, { x, y: y - 3 });
                    }
                } else {
                    continue;
                }
            }
            if (direction === 'down') {
                if (horizontals[row][column]) {
                    if (y > speedlimit) {
                        //
                    } else {
                        Body.setVelocity(object, { x, y: y + 3 });
                    }
                } else {
                    continue;
                }
            }
            if (direction === 'left') {
                if (verticals[row][column - 1]) {
                    if (x < -speedlimit) {
                        //
                    } else {
                        Body.setVelocity(object, { x: x - 3, y });
                    }
                } else {
                    continue;
                }
            }
            if (direction === 'right') {
                if (verticals[row][column]) {
                    if (x > speedlimit) {
                        //
                    } else {
                        Body.setVelocity(object, { x: x + 3, y });
                    }
                } else {
                    continue;
                }
            }
            row = getRow(object);
            column = getColumn(object);
            if (row == targetRow && column == targetColumn) {
                is_target_reached = 1;
            }
        }
    }

}

const restart = () => {
    window.location.reload();
}
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
const teleportBall = () => {
    row = randomIntFromInterval(0, cellsVertical - 1);
    column = randomIntFromInterval(0, cellsHorizontal - 1);
    var audio = new Audio("teleportation.mp3");
    audio.play();
    changePosition(ball, row, column);
}

ghostPlayOn();
