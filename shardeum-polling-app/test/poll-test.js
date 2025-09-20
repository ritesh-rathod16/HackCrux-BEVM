const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Poll Contract", function () {
  let Poll, poll, owner, addr1;

  beforeEach(async function () {
    Poll = await ethers.getContractFactory("Poll");
    [owner, addr1] = await ethers.getSigners();
    poll = await Poll.deploy("Who should win?", ["A", "B", "C"]);
    await poll.deployed();
  });

  it("Should set the question and options correctly", async function () {
    expect(await poll.question()).to.equal("Who should win?");
    const options = await poll.getOptions();
    expect(options.length).to.equal(3);
    expect(options[0]).to.equal("A");
  });

  it("Should allow voting and prevent double voting", async function () {
    await poll.connect(addr1).vote(1);
    expect(await poll.getVotes(1)).to.equal(1);

    await expect(poll.connect(addr1).vote(1)).to.be.revertedWith("You already voted");
  });
});
