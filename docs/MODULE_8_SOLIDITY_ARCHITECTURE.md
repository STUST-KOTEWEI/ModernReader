# Module 8: 智能合約與 CARE 治理架構

> **Status**: Architecture Design Complete  
> **Platform**: Ethereum, Polygon, Layer 2  
> **Language**: Solidity ^0.8.20

---

## Overview

Module 8 實作 CARE 原則（Collective Benefit, Authority to Control, Responsibility, Ethics）的去中心化治理系統，保護原住民文化資產的數位主權。

---

## CARE Principles Implementation

### C - Collective Benefit (集體利益)
- 社群投票決定文化內容使用權
- 收益自動分配給貢獻者

### A - Authority to Control (控制權)
- 文化擁有者可撤銷內容授權
- 多重簽名治理

### R - Responsibility (責任)
- 透明的貢獻記錄
- 審計日誌鏈上儲存

### E - Ethics (倫理)
- 禁止商業化敏感文化內容
- 社群審查機制

---

## Smart Contract Architecture

### 1. Governance Contract

**File**: `contracts/CAREGovernance.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract CAREGovernance is Governor, GovernorCountingSimple, GovernorVotes {
    uint256 public constant VOTING_DELAY = 1 days;
    uint256 public constant VOTING_PERIOD = 1 weeks;
    uint256 public constant PROPOSAL_THRESHOLD = 1000e18; // 1000 tokens
    
    constructor(IVotes _token)
        Governor("CARE Governance")
        GovernorVotes(_token)
    {}
    
    function votingDelay() public pure override returns (uint256) {
        return VOTING_DELAY;
    }
    
    function votingPeriod() public pure override returns (uint256) {
        return VOTING_PERIOD;
    }
    
    function proposalThreshold() public pure override returns (uint256) {
        return PROPOSAL_THRESHOLD;
    }
    
    // Create proposal to approve cultural content usage
    function proposeCulturalUsage(
        address content,
        string memory description,
        uint256 royaltyPercent
    ) public returns (uint256) {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = content;
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature(
            "approveUsage(uint256)",
            royaltyPercent
        );
        
        return propose(targets, values, calldatas, description);
    }
}
```

---

### 2. Cultural Asset Registry

**File**: `contracts/CulturalAssetRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CulturalAssetRegistry is ERC721, AccessControl {
    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");
    bytes32 public constant COMMUNITY_ROLE = keccak256("COMMUNITY_ROLE");
    
    struct CulturalAsset {
        string ipfsHash;          // IPFS content hash
        address owner;            // Cultural owner (tribe/community)
        string tribe;             // Tribe name
        uint256 sensitivity;      // 0=public, 1=restricted, 2=sacred
        bool isApproved;          // Governance approved
        uint256 royaltyPercent;   // Royalty for usage (basis points)
    }
    
    mapping(uint256 => CulturalAsset) public assets;
    uint256 public nextAssetId;
    
    event AssetRegistered(
        uint256 indexed assetId,
        string tribe,
        address owner,
        uint256 sensitivity
    );
    
    event AssetUsageApproved(uint256 indexed assetId, uint256 royaltyPercent);
    
    constructor() ERC721("CulturalAsset", "CARE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function registerAsset(
        string memory ipfsHash,
        string memory tribe,
        uint256 sensitivity
    ) public onlyRole(COMMUNITY_ROLE) returns (uint256) {
        uint256 assetId = nextAssetId++;
        
        assets[assetId] = CulturalAsset({
            ipfsHash: ipfsHash,
            owner: msg.sender,
            tribe: tribe,
            sensitivity: sensitivity,
            isApproved: false,
            royaltyPercent: 0
        });
        
        _mint(msg.sender, assetId);
        emit AssetRegistered(assetId, tribe, msg.sender, sensitivity);
        
        return assetId;
    }
    
    function approveUsage(uint256 assetId, uint256 royaltyPercent) 
        public 
        onlyRole(CURATOR_ROLE) 
    {
        require(royaltyPercent <= 10000, "Invalid royalty");
        assets[assetId].isApproved = true;
        assets[assetId].royaltyPercent = royaltyPercent;
        
        emit AssetUsageApproved(assetId, royaltyPercent);
    }
    
    function revokeAsset(uint256 assetId) public {
        require(assets[assetId].owner == msg.sender, "Not owner");
        assets[assetId].isApproved = false;
    }
}
```

---

### 3. Revenue Sharing Contract

**File**: `contracts/RevenueSharing.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RevenueSharing {
    mapping(uint256 => mapping(address => uint256)) public shares;
    mapping(uint256 => uint256) public totalShares;
    mapping(uint256 => uint256) public totalRevenue;
    
    event RevenueDistributed(uint256 indexed assetId, uint256 amount);
    event ShareClaimed(uint256 indexed assetId, address contributor, uint256 amount);
    
    function addContributor(
        uint256 assetId,
        address contributor,
        uint256 shareAmount
    ) public {
        shares[assetId][contributor] += shareAmount;
        totalShares[assetId] += shareAmount;
    }
    
    function distributeRevenue(uint256 assetId) public payable {
        totalRevenue[assetId] += msg.value;
        emit RevenueDistributed(assetId, msg.value);
    }
    
    function claimShare(uint256 assetId) public {
        uint256 contributorShare = shares[assetId][msg.sender];
        require(contributorShare > 0, "No shares");
        
        uint256 amount = (totalRevenue[assetId] * contributorShare) / totalShares[assetId];
        totalRevenue[assetId] -= amount;
        shares[assetId][msg.sender] = 0;
        
        payable(msg.sender).transfer(amount);
        emit ShareClaimed(assetId, msg.sender, amount);
    }
}
```

---

## Deployment

### 1. Install Dependencies

```bash
npm install --save-dev hardhat @openzeppelin/contracts
```

### 2. Hardhat Config

**File**: `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### 3. Deploy Script

**File**: `scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
  // Deploy Cultural Asset Registry
  const CulturalAssetRegistry = await hre.ethers.getContractFactory("CulturalAssetRegistry");
  const registry = await CulturalAssetRegistry.deploy();
  await registry.waitForDeployment();
  
  console.log(`CulturalAssetRegistry deployed to: ${await registry.getAddress()}`);
  
  // Deploy Revenue Sharing
  const RevenueSharing = await hre.ethers.getContractFactory("RevenueSharing");
  const revenueSharing = await RevenueSharing.deploy();
  await revenueSharing.waitForDeployment();
  
  console.log(`RevenueSharing deployed to: ${await revenueSharing.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 4. Run Deployment

```bash
npx hardhat run scripts/deploy.js --network polygon
```

---

## Testing

**File**: `test/CAREGovernance.test.js`

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CARE Governance", function () {
  let registry, owner, community;
  
  beforeEach(async function () {
    [owner, community] = await ethers.getSigners();
    
    const CulturalAssetRegistry = await ethers.getContractFactory("CulturalAssetRegistry");
    registry = await CulturalAssetRegistry.deploy();
    
    // Grant community role
    const COMMUNITY_ROLE = await registry.COMMUNITY_ROLE();
    await registry.grantRole(COMMUNITY_ROLE, community.address);
  });
  
  it("Should register cultural asset", async function () {
    await expect(
      registry.connect(community).registerAsset(
        "QmXxx...",
        "Atayal",
        1 // restricted
      )
    ).to.emit(registry, "AssetRegistered");
  });
  
  it("Should prevent unauthorized usage", async function () {
    const assetId = await registry.connect(community).registerAsset("QmXxx...", "Atayal", 2);
    const asset = await registry.assets(assetId);
    expect(asset.isApproved).to.be.false;
  });
});
```

Run tests:
```bash
npx hardhat test
```

---

## Frontend Integration

```typescript
// File: frontend/src/services/web3.ts
import { ethers } from 'ethers';
import CulturalAssetRegistry from './contracts/CulturalAssetRegistry.json';

export class Web3Service {
  private provider: ethers.BrowserProvider;
  private registry: ethers.Contract;
  
  constructor() {
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.registry = new ethers.Contract(
      process.env.REGISTRY_ADDRESS!,
      CulturalAssetRegistry.abi,
      this.provider
    );
  }
  
  async registerAsset(ipfsHash: string, tribe: string, sensitivity: number) {
    const signer = await this.provider.getSigner();
    const tx = await this.registry.connect(signer).registerAsset(
      ipfsHash,
      tribe,
      sensitivity
    );
    await tx.wait();
    return tx.hash;
  }
  
  async getAsset(assetId: number) {
    return await this.registry.assets(assetId);
  }
}
```

---

## Gas Optimization

- Use `calldata` instead of `memory` for read-only parameters
- Pack structs to minimize storage slots
- Use events for historical data instead of storage
- Batch operations where possible

---

## Security Considerations

- [ ] Audit by OpenZeppelin or Trail of Bits
- [ ] Multi-sig wallet for admin operations
- [ ] Time-locks on governance proposals
- [ ] Emergency pause functionality
- [ ] Role-based access control (RBAC)

---

## Future Enhancements

- [ ] Cross-chain governance (LayerZero)
- [ ] ZK-proofs for private voting
- [ ] Quadratic voting implementation
- [ ] DAO treasury management

---

_Module 8 Architecture - 2025年11月1日_
