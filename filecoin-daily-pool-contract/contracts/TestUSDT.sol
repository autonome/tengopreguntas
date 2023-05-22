// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Tether USD", "USDT") {
        mint(_msgSender(), 1000000 * 10**decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 9;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
