'use strict';

let restify = require('restify')
let builder = require('botbuilder')
let request = require('request')

let server = restify.createServer()
server.listen(3978, function(){
	console.log('The server is running on ', server.name, server.url)
})

// Olha o conector ai
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})

//When the server posts to /api/messages, make the connector listen to it.
server.post('/api/messages', connector.listen())

let bot = new builder.UniversalBot(connector, (session) => {
	listaCotacoes(session)
})

// Cade os intents?
bot.recognizer({
	recognize: function (context, done) {
		var intent = { score: 0.0 }
		
		if (context.message.text) {
			switch (context.message.text.toLowerCase()) {
				case 'ajuda':
					intent = { score: 1.0, intent: 'Ajuda' }
				break
				case 'tchau':
					intent = { score: 1.0, intent: 'Tchau' }
				break
				case 'btc':
					intent = { score: 1.0, intent: 'BTC-Price' }
				break
				case 'eth':
					intent = { score: 1.0, intent: 'ETH-Price' }
				break
				case 'bhc':
					intent = { score: 1.0, intent: 'BHC-Price' }
				break
			}
		}
		done(null, intent)
    }
})


bot.dialog('helpDialog', (session) => {    
	listaCotacoes(session)
}).triggerAction({ matches: 'Ajuda' });


function listaCotacoes(session){
	let msg = new builder.Message(session)
		.text("Temos cotaçãoo para as seguintes moedas:")
		.suggestedActions(
			builder.SuggestedActions.create(
				session, [
					builder.CardAction.imBack(session, "ETH", "Ethereum"),
					builder.CardAction.imBack(session, "BTC", "Bitcoin"),
					builder.CardAction.imBack(session, "BHC", "Bitcoin Cash")
				]
			));
	session.send(msg)
}

bot.endConversationAction('tchauAction', "Foi um prazer te ajudar! Até logo!", { matches: 'Tchau' })

bot.dialog('BTCPriceDialog', (session) => {
	session.send("Consultando o serviço de cotações, por favor, aguarde.")
    getQuote(session, 'BTC')
}).triggerAction({ matches: 'BTC-Price' });

bot.dialog('ETHPriceDialog', (session) => {
	session.send("Consultando o serviço de cotações, por favor, aguarde.")
    getQuote(session, 'ETH')
}).triggerAction({ matches: 'ETH-Price' });

bot.dialog('BHCPriceDialog', (session) => {
	session.send("Consultando o serviço de cotações, por favor, aguarde.")
	getQuote(session, 'BHC')
}).triggerAction({ matches: 'BHC-Price' });


function getQuote(session, coin) {
	request('https://min-api.cryptocompare.com/data/price?fsym=' + coin + '&tsyms=USD,EUR,BRL', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			let info = JSON.parse(body)
			session.send("1 " + coin + " vale : R$ " + info.BRL)
			session.send("1 " + coin + " vale : USD$ " + info.USD)
			session.send("1 " + coin + " vale : EUR$ " + info.EUR)
		}
	})
}