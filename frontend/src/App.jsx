import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PollAbi from "./Poll.json";
import React from "react";

const CONTRACT_ADDRESS = "0x993fD26E21C15C4915c4B41e9955ab824583CFac";

function App() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [account, setAccount] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showAddAccountHelp, setShowAddAccountHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); // New state for welcome animation

  useEffect(() => { 
    // Show welcome animation for 3 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
      checkWalletConnected();
    }, 3000);
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      clearTimeout(timer);
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (walletConnected) {
      loadContract();
    }
  }, [walletConnected, account]);

  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // User switched accounts
      setAccount(accounts[0]);
      setWalletConnected(true);
      loadContract();
    }
  }

  async function checkWalletConnected() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
    }
  }

  async function loadContract() {
    if (!window.ethereum || !account) return;
    setIsLoading(true);
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const poll = new ethers.Contract(CONTRACT_ADDRESS, PollAbi.abi, provider);

      setQuestion(await poll.question());
      const opts = await poll.getOptions();
      setOptions(opts);

      const v = [];
      for (let i = 0; i < opts.length; i++) {
        v.push((await poll.getVotes(i)).toString());
      }
      setVotes(v);

      // Check if current account has already voted
      const voterStatus = await poll.voters(account);
      setHasVoted(voterStatus);
    } catch (error) {
      console.error("Error loading contract:", error);
    }
    setIsLoading(false);
  }

  async function vote() {
    if (selectedOption === null || hasVoted) return;
    
    setIsVoting(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const poll = new ethers.Contract(CONTRACT_ADDRESS, PollAbi.abi, signer);
      
      const tx = await poll.vote(selectedOption);
      await tx.wait();
      
      // Reload contract data to get updated vote count and voting status
      await loadContract();
    } catch (error) {
      console.error("Error voting:", error);
      alert("Voting failed. You may have already voted.");
    }
    setIsVoting(false);
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install a Web3 wallet to use this dApp!");
      return;
    }
    
    try {
      setIsLoading(true);
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      // If multiple accounts available, show selector
      if (accounts.length > 1) {
        setAvailableAccounts(accounts);
        setShowAccountSelector(true);
      } else {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
    setIsLoading(false);
  }

  async function selectAccount(selectedAccount) {
    setAccount(selectedAccount);
    setWalletConnected(true);
    setShowAccountSelector(false);
  }

  function disconnectWallet() {
    setWalletConnected(false);
    setAccount("");
    setHasVoted(false);
    setSelectedOption(null);
    setQuestion("");
    setOptions([]);
    setVotes([]);
  }

  async function switchAccount() {
    try {
      // Request accounts again to refresh the list
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (accounts.length > 1) {
        setAvailableAccounts(accounts);
        setShowAccountSelector(true);
      } else {
        // If only one account, just switch to it
        setAccount(accounts[0]);
        loadContract();
      }
    } catch (error) {
      console.error("Error switching account:", error);
    }
  }

  async function refreshAccounts() {
    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (accounts.length > 1) {
        setAvailableAccounts(accounts);
        setShowAccountSelector(true);
      } else {
        setAccount(accounts[0]);
        loadContract();
      }
    } catch (error) {
      console.error("Error refreshing accounts:", error);
    }
  }

  // Format address for display
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex items-center justify-center p-4">
      {/* Welcome Animation */}
      {showWelcome && (
        <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
          <div className="animate-pulse">
            {/* AVS Logo - Replace with your actual logo */}
            <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-white text-2xl font-bold">AVS</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mt-8 animate-bounce">Welcome to Shardeum Voting</h2>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Shardeum Polling System</h1>
              <p className="text-indigo-200 text-sm">Secure voting on the Shardeum network</p>
            </div>
          </div>
          {walletConnected && (
            <button 
              onClick={disconnectWallet}
              className="text-sm bg-indigo-900 bg-opacity-50 hover:bg-opacity-70 px-3 py-1 rounded-lg transition-colors"
              title="Disconnect Wallet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Account Selector Modal */}
        {showAccountSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Select Wallet Account</h2>
                <p className="text-gray-400 text-sm mt-1">Choose which account to connect</p>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {availableAccounts.map((acc, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg mb-2 cursor-pointer transition-colors ${
                      acc === account 
                        ? 'bg-indigo-900 bg-opacity-30 border border-indigo-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => selectAccount(acc)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono">{formatAddress(acc)}</span>
                      {acc === account && (
                        <span className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                  <button 
                    onClick={() => setShowAddAccountHelp(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add a new account in your wallet
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-between">
                <button 
                  onClick={refreshAccounts}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Accounts
                </button>
                <button 
                  onClick={() => setShowAccountSelector(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Account Help Modal */}
        {showAddAccountHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Add Account in Wallet</h2>
                <p className="text-gray-400 text-sm mt-1">Follow these steps to add a new account</p>
              </div>
              <div className="p-6">
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Open your Web3 wallet extension</li>
                  <li>Click on the account switcher (top center)</li>
                  <li>Click on "Add account or hardware wallet"</li>
                  <li>Follow the prompts to create a new account</li>
                  <li>Return to this page and click "Refresh Accounts"</li>
                </ol>
                <div className="mt-6 bg-indigo-900 bg-opacity-20 p-4 rounded-lg">
                  <p className="text-sm text-indigo-300">
                    Note: You may need to reconnect after adding a new account for it to appear in the list.
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button 
                  onClick={() => setShowAddAccountHelp(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {!walletConnected ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Please connect your wallet to view and participate in the poll</p>
              <button 
                onClick={connectWallet}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Connect Wallet
                  </span>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-4">We'll only use your wallet address for voting purposes</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
              <p>Loading poll data...</p>
            </div>
          ) : (
            <>
              {/* Question */}
              <h2 className="text-xl font-semibold mb-6 text-center">{question}</h2>
              
              {/* Wallet Connection Status */}
              <div className="bg-gray-700 rounded-lg p-3 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div>
                    <span className="text-sm block">Connected: {formatAddress(account)}</span>
                    <button 
                      onClick={switchAccount}
                      className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                    >
                      Switch account
                    </button>
                  </div>
                </div>
                {hasVoted && (
                  <span className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded">
                    Already Voted
                  </span>
                )}
              </div>
              
              {/* Options List */}
              <div className="space-y-3 mb-6">
                {options.map((opt, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedOption === i 
                        ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                        : 'border-gray-700 hover:border-gray-600'
                    } ${hasVoted ? 'cursor-default' : ''}`}
                    onClick={() => !hasVoted && setSelectedOption(i)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={hasVoted ? 'opacity-90' : ''}>{opt}</span>
                      <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                        {votes[i]} votes
                      </span>
                    </div>
                    
                    {/* Vote percentage bar */}
                    {hasVoted && votes.length > 0 && (
                      <div className="mt-3 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(parseInt(votes[i]) / Math.max(1, ...votes.map(v => parseInt(v) || 0)) * 100) || 0}%` 
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Vote Button */}
              {!hasVoted && (
                <button 
                  onClick={vote}
                  disabled={selectedOption === null || isVoting}
                  className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
                    selectedOption === null || isVoting
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isVoting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Vote...
                    </>
                  ) : (
                    'Cast Your Vote'
                  )}
                </button>
              )}
              
              {/* Already Voted Message */}
              {hasVoted && (
                <div className="text-center py-4 bg-green-900 bg-opacity-20 rounded-lg border border-green-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-400">Thank you for voting! Your choice has been recorded on the blockchain.</p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 bg-opacity-50 p-4 text-center text-xs text-gray-500">
          Powered by Shardeum · Votes are final and cannot be changed
        </div>
      </div>
    </div>
  );
}

export default App;