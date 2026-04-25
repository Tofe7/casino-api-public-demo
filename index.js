// Casino API Aggregator - Fresh Start
// This file contains all the application logic but does not start the server automatically

// Initialize core modules and dependencies
console.log('Casino API Aggregator prepared. Awaiting explicit server start...');

// Import required dependencies
let express, cors;
try {
  express = require('express');
  cors = require('cors');
  require('dotenv').config();
  console.log('✓ Dependencies available');
} catch (error) {
  console.error('✗ Failed to load dependencies:', error.message);
  console.error('Please run `npm install` to install required packages');
  process.exit(1);
}

// Define the application setup function
function createApp() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock data for games
  const games = {
    'pragmatic': [
      { id: 'pg-001', name: 'Sweet Bonanza', provider: 'Pragmatic Play', type: 'slots' },
      { id: 'pg-002', name: 'Wolf Gold', provider: 'Pragmatic Play', type: 'slots' },
    ],
    'pgsoft': [
      { id: 'pgs-001', name: 'Honey Money', provider: 'PG Soft', type: 'slots' },
      { id: 'pgs-002', name: 'Dragon Legend', provider: 'PG Soft', type: 'slots' },
    ],
    'nexusggr': [
      { id: 'nx-001', name: 'Live Blackjack', provider: 'NexusGGR', type: 'live_casino' },
      { id: 'nx-002', name: 'Live Roulette', provider: 'NexusGGR', type: 'live_casino' },
    ]
  };

  // In-memory storage for user sessions and balances
  const userSessions = new Map();
  const userBalances = new Map();

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Casino API Aggregator'
    });
  });

  // Get all games from all providers
  app.get('/api/games', (req, res) => {
    const provider = req.query.provider;
    
    if (provider && games[provider]) {
      return res.status(200).json(games[provider]);
    }
    
    // Combine all games if no specific provider requested
    const allGames = Object.values(games).flat();
    res.status(200).json(allGames);
  });

  // Get game by ID
  app.get('/api/game/:id', (req, res) => {
    const gameId = req.params.id;
    
    // Find the game across all providers
    let foundGame = null;
    for (const provider in games) {
      const game = games[provider].find(g => g.id === gameId);
      if (game) {
        foundGame = game;
        break;
      }
    }
    
    if (!foundGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.status(200).json(foundGame);
  });

  // Launch a game (create session)
  app.post('/api/launch', (req, res) => {
    const { userId, gameId, demoBalance } = req.body;
    
    if (!userId || !gameId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and gameId' 
      });
    }
    
    // Check if game exists
    let targetGame = null;
    for (const provider in games) {
      const game = games[provider].find(g => g.id === gameId);
      if (game) {
        targetGame = game;
        break;
      }
    }
    
    if (!targetGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle demo mode
    if (demoBalance !== undefined) {
      userBalances.set(`${userId}_demo`, parseFloat(demoBalance));
      userSessions.set(sessionId, {
        userId: `${userId}_demo`,
        gameId,
        gameInfo: targetGame,
        createdAt: new Date()
      });
      
      return res.status(200).json({
        success: true,
        sessionId,
        gameUrl: `/play?session=${sessionId}&demo=true`,
        gameInfo: targetGame
      });
    }
    
    // Regular play mode
    let balance = userBalances.get(userId) || 0;
    
    if (balance <= 0) {
      return res.status(400).json({ 
        error: 'Insufficient balance. Please deposit funds.' 
      });
    }
    
    userSessions.set(sessionId, {
      userId,
      gameId,
      gameInfo: targetGame,
      createdAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      sessionId,
      gameUrl: `/play?session=${sessionId}`,
      gameInfo: targetGame
    });
  });

  // Game play endpoint
  app.get('/play', (req, res) => {
    const { session } = req.query;
    
    if (!session) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const sessionData = userSessions.get(session);
    
    if (!sessionData) {
      return res.status(400).json({ error: 'Invalid session' });
    }
    
    // Render a basic HTML page for the game
    const gamePage = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>${sessionData.gameInfo.name} - Casino</title>
          <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #0d1117; color: #fff; }
              .game-container { max-width: 800px; margin: 0 auto; text-align: center; }
              .header { background-color: #1a1e24; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .game-frame { width: 100%; height: 600px; border: none; background-color: #161b22; border-radius: 8px; }
              .balance-display { margin-top: 15px; font-size: 18px; }
              button { background-color: #238636; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
              button:hover { background-color: #2ea043; }
          </style>
      </head>
      <body>
          <div class="game-container">
              <div class="header">
                  <h1>${sessionData.gameInfo.name}</h1>
                  <p>Provider: ${sessionData.gameInfo.provider} | Type: ${sessionData.gameInfo.type}</p>
              </div>
              
              <div class="game-frame">
                  <p>Loading game content...</p>
                  <p>Game ID: ${sessionData.gameId}</p>
                  <p>Session ID: ${session}</p>
              </div>
              
              <div class="balance-display">
                  Balance: $${userBalances.get(sessionData.userId) || 0}
              </div>
              
              <button onclick="performSpin()">SPIN</button>
              <button onclick="checkBalance()">Check Balance</button>
              <button onclick="exitGame()">Exit Game</button>
          </div>
          
          <script>
              function performSpin() {
                  // Simulate spin action
                  fetch('/api/spin', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                          session: '${session}',
                          betAmount: 1.0
                      })
                  })
                  .then(response => response.json())
                  .then(data => {
                      alert('Spin result: ' + JSON.stringify(data));
                  });
              }
              
              function checkBalance() {
                  fetch('/api/balance')
                  .then(response => response.json())
                  .then(data => {
                      document.querySelector('.balance-display').textContent = 'Balance: $' + data.balance;
                  });
              }
              
              function exitGame() {
                  window.close();
              }
          </script>
      </body>
      </html>
    `;
    
    res.send(gamePage);
  });

  // Spin endpoint (for slot games)
  app.post('/api/spin', (req, res) => {
    const { session, betAmount } = req.body;
    
    if (!session || !betAmount) {
      return res.status(400).json({ error: 'Session and bet amount are required' });
    }
    
    const sessionData = userSessions.get(session);
    
    if (!sessionData) {
      return res.status(400).json({ error: 'Invalid session' });
    }
    
    const userId = sessionData.userId;
    let balance = userBalances.get(userId) || 0;
    
    if (balance < parseFloat(betAmount)) {
      return res.status(400).json({ error: 'Insufficient balance for this bet' });
    }
    
    // Deduct bet amount
    balance -= parseFloat(betAmount);
    
    // Random win calculation (simplified)
    const winMultiplier = Math.random() > 0.7 ? (Math.random() * 5) : 0; // 30% chance to win
    const winnings = parseFloat(betAmount) * winMultiplier;
    balance += winnings;
    
    userBalances.set(userId, balance);
    
    res.status(200).json({
      success: true,
      betAmount: parseFloat(betAmount),
      winnings: winnings,
      balance: balance,
      win: winnings > 0
    });
  });

  // Get user balance
  app.get('/api/balance', (req, res) => {
    // Get user from session header if available, otherwise use a default
    const session = req.headers['x-session-id'];
    
    if (!session) {
      return res.status(200).json({
        userId: 'default_user',
        balance: 0
      });
    }
    
    const sessionData = userSessions.get(session);
    if (!sessionData) {
      return res.status(400).json({ error: 'Session not found' });
    }
    
    const balance = userBalances.get(sessionData.userId) || 0;
    
    res.status(200).json({
      userId: sessionData.userId,
      balance
    });
  });

  // Deposit funds endpoint
  app.post('/api/deposit', (req, res) => {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: 'UserId and amount are required' });
    }
    
    const currentBalance = userBalances.get(userId) || 0;
    const newBalance = currentBalance + parseFloat(amount);
    
    userBalances.set(userId, newBalance);
    
    res.status(200).json({
      success: true,
      userId,
      newBalance
    });
  });

  // Withdraw funds endpoint
  app.post('/api/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: 'UserId and amount are required' });
    }
    
    const currentBalance = userBalances.get(userId) || 0;
    const newBalance = currentBalance - parseFloat(amount);
    
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance for withdrawal' });
    }
    
    userBalances.set(userId, newBalance);
    
    res.status(200).json({
      success: true,
      userId,
      newBalance
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return { app, PORT };
}

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  const { app, PORT } = createApp();
  app.listen(PORT, () => {
    console.log(`\nCasino API Aggregator listening at http://localhost:${PORT}`);
    console.log('\nAvailable endpoints:');
    console.log('- GET /api/health - Health check');
    console.log('- GET /api/games - List all games');
    console.log('- POST /api/launch - Launch a game');
    console.log('- GET /play?session=... - Play game');
    console.log('- POST /api/spin - Spin for slots');
    console.log('- GET /api/balance - Get user balance');
    console.log('- POST /api/deposit - Deposit funds');
    console.log('- POST /api/withdraw - Withdraw funds');
    console.log('\nTo start the server on a different port:');
    console.log('> $env:PORT=XXXX; node index.js (PowerShell)');
    console.log('> PORT=XXXX node index.js (Command Prompt)');
  });
} else {
  // Export the function if this module is imported elsewhere
  module.exports = createApp;
}