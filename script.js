const csvURL =
https://docs.google.com/spreadsheets/d/e/2PACX-1vTBtyGriDud4pVArvyGHpC3aptGso3l6xn2B8phOwMIn2JekjQZPPkKzt2274D82ie1djrwndV6PcFC/pub?gid=481332784&single=true&output=csv;

const medals = ["🥇","🥈","🥉","🏅"];
const classes = ["first","second","third","fourth"];

async function loadLeaderboard() {

    const cards = document.getElementById("cards");
    const updated = document.getElementById("updated");

    cards.innerHTML = "<h2>Loading...</h2>";

    try {

        const response = await fetch(csvURL + "&t=" + Date.now());

        const csv = await response.text();

        Papa.parse(csv, {

            header: true,
            skipEmptyLines: true,

            complete: function(results) {

                console.log(results.data);

                let players = [];

                results.data.forEach(row => {

                    const balance = Number(
                        String(row.Balance)
                        .replace(/\$/g,"")
                        .replace(/,/g,"")
                    );

                    if(!isNaN(balance)){

                        players.push({

                            name: row.Child,
                            balance: balance

                        });

                    }

                });

                players.sort((a,b)=>b.balance-a.balance);

                cards.innerHTML="";

                players.forEach((player,index)=>{

                    cards.innerHTML += `

<div class="card ${classes[index]}">

<div class="name">

${medals[index]} ${player.name}

</div>

<div class="bal">

${player.balance.toLocaleString("en-US",{

style:"currency",

currency:"USD"

})}

</div>

</div>

`;

                });

                updated.innerHTML =
                    "Updated " +
                    new Date().toLocaleString();

            }

        });

    }

    catch(error){

        console.error(error);

        cards.innerHTML =

        `<h2 style="color:red">

        Unable to load Google Sheet.

        </h2>

        <p>

        ${error}

        </p>`;

    }

}

loadLeaderboard();

setInterval(loadLeaderboard,300000);
