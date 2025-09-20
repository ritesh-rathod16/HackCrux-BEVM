// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Poll {
    string public question;
    string[] public options;
    mapping(uint => uint) public votes;
    mapping(address => bool) public hasVoted;

    constructor(string memory _question, string[] memory _options) {
        question = _question;
        options = _options;
    }

    function vote(uint option) public {
        require(option < options.length, "Invalid option");
        require(!hasVoted[msg.sender], "You already voted");

        hasVoted[msg.sender] = true;
        votes[option]++;
    }

    function getOptions() public view returns (string[] memory) {
        return options;
    }

    function getVotes(uint option) public view returns (uint) {
        return votes[option];
    }
}
