// SPDX-License-Identifier: MIT
/*
                                                                                                    
                                                                                                    
                                                                                                    
                                :::::                            ..                                 
                             ------::::                       ...........                           
                           ++++===---::.                     ..............                         
                         ***+++++===--::                     ..............:                        
                         ******++++==-::                     ............::::                       
                        #####*****++==-::                    ........:.::::::                       
                        ########****+=-::                   .....:...::::::::                       
                        ###########**+=-:                   .....::.:::::::::                       
                        #%%%%%%%%####*+=-:                 ........::::::::::                       
                        %%%%%%%%%%%%##*+=-:               ..........::::::::=                       
                        %%%%%%%%%%%%%##*+=-              ...........:::::::=*                       
                        %%%%%%%%%%%%%%##**+-:          ..............:::::=##                       
                        %%%%%%%%%%%%%%%##**+-:       .................:::=*##                       
                        %%%%%%%%%%%%%%%%##**+-:  .....................::+####                       
                        #%%%%%%%%%%%%%%%###*++-......................:+*#####                       
                        #%%%%%%%%%%%%%####*+:......................=***####%%                       
                        #####%%#########*=..................::-=+****####%%%%                       
                        ##############*:............::==+++*****######%%%%%%%                       
                        *##########**-........        -=+***#####%%%%%%%%%%%%                       
                        ***####****=....::::            -+*####%%%%%%%%%%%%%%                       
                        +********+:..::::::              =+*###%%%%%%%%%%%%%%                       
                        =++****++..:::---:                =+*###%%%%%%%%%%%%%                       
                        ==+++++=.::-------                -+**###%%%%%%%%%%%%                       
                        :-====-::---====-:                :=+**####%%%%%%%%%%                       
                        ::----::---=====-:                 =++***#####%%%%%%#                       
                        .:::::::---====--:                 -=++****##########                       
                         .::::::---------:                 -=++++***********                        
                          ...:::::-------:                 -==+++++++++++++                         
                           ....::::::::::                  ---=========--                           
                             .....:::::=                     -:::::::--+                            
                                ----====                     ========                               
                                                                                                    
                                                                                                    
                        ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗                                  
                        ██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗                                 
                        ███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝                                 
                        ██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗                                 
                        ██║  ██║   ██║   ██║     ███████╗██║  ██║                                 
                        ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝                                 
                                                                                                    
           ███████╗████████╗██╗  ██╗███████╗██████╗ ███████╗ █████╗ ██╗                          
           ██╔════╝╚══██╔══╝██║  ██║██╔════╝██╔══██╗██╔════╝██╔══██╗██║                          
           █████╗     ██║   ███████║█████╗  ██████╔╝█████╗  ███████║██║                          
           ██╔══╝     ██║   ██╔══██║██╔══╝  ██╔══██╗██╔══╝  ██╔══██║██║                          
           ███████╗   ██║   ██║  ██║███████╗██║  ██║███████╗██║  ██║███████╗                     
           ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝                     
                                                                                                    
         ██╗      █████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗  ██╗                                     
         ██║     ██╔══██╗██║   ██║████╗  ██║██╔════╝██║  ██║                                     
         ██║     ███████║██║   ██║██╔██╗ ██║██║     ███████║                                     
         ██║     ██╔══██║██║   ██║██║╚██╗██║██║     ██╔══██║                                     
         ███████╗██║  ██║╚██████╔╝██║ ╚████║╚██████╗██║  ██║                                     
         ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝                                     
                                                                                                    
         ██████╗ ██╗      █████╗ ████████╗███████╗ ██████╗ ██████╗ ███╗   ███╗                   
         ██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗████╗ ████║                   
         ██████╔╝██║     ███████║   ██║   █████╗  ██║   ██║██████╔╝██╔████╔██║                   
         ██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║                   
         ██║     ███████╗██║  ██║   ██║   ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║                   
         ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝                   
                                                                                                    
*/
pragma solidity 0.8.20;

/**
 * @title HyperLaunch721FactoryV2
 * @notice Factory contract for deploying HyperLaunch NFT collections using EIP-1167 minimal proxies
 * @dev Deploys gas-efficient clones of the implementation contract
 */

// Interface for the implementation contract
interface IHyperLaunchERC721 {
    struct Sale {
        uint256 publicPriceWei;
        uint256 allowlistPriceWei;
        uint64 publicStart;
        uint64 publicEnd;
        uint64 allowlistStart;
        uint64 allowlistEnd;
        uint32 maxPerWallet;
        uint32 maxPerTx;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory baseURI_,
        address payout_,
        address royaltyReceiver,
        uint96 royaltyBps,
        Sale memory sale_,
        bytes32 merkleRoot_,
        address platformFeeReceiver_,
        uint96 platformFeeBps_
    ) external;
    
    function transferOwnership(address newOwner) external;
}

contract HyperLaunch721FactoryV2 {
    // Implementation contract address
    address public immutable implementation;
    
    // Platform administration
    address public owner;
    address public platformFeeReceiver;
    uint96 public platformFeeBps;
    
    // Track deployed drops
    mapping(address creator => address[] drops) public creatorDrops;
    address[] public allDrops;
    
    // Events
    event DropDeployed(address indexed creator, address indexed drop, bytes32 salt);
    event PlatformFeeUpdated(address indexed receiver, uint96 bps);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Errors
    error InvalidConfiguration();
    error CloneFailed();
    error Unauthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(
        address impl,
        address feeReceiver,
        uint96 feeBps
    ) {
        if (impl == address(0)) revert InvalidConfiguration();
        if (feeReceiver == address(0)) revert InvalidConfiguration();
        if (feeBps > 1000) revert InvalidConfiguration(); // Max 10%
        
        implementation = impl;
        platformFeeReceiver = feeReceiver;
        platformFeeBps = feeBps;
        owner = msg.sender; // Set deployer as owner
        
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function deployDrop(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory baseURI_,
        address payout_,
        address royaltyReceiver,
        uint96 royaltyBps,
        IHyperLaunchERC721.Sale memory sale_,
        bytes32 merkleRoot_,
        bytes32 salt
    ) external returns (address drop) {
        // Cache platform fee state to minimize SLOADs
        address feeReceiver = platformFeeReceiver;
        uint96 feeBps = platformFeeBps;
        // Deploy clone
        if (salt == bytes32(0)) {
            // Non-deterministic deployment
            drop = _clone(implementation);
        } else {
            // Deterministic deployment with CREATE2
            drop = _cloneDeterministic(implementation, salt);
        }
        
        if (drop == address(0)) revert CloneFailed();
        // Validate that code exists at deployed address to guard against failed deployment
        uint256 codeSize;
        assembly { codeSize := extcodesize(drop) }
        if (codeSize == 0) revert CloneFailed();
        
        // Initialize the clone
        IHyperLaunchERC721(drop).initialize(
            name_,
            symbol_,
            maxSupply_,
            baseURI_,
            payout_,
            royaltyReceiver,
            royaltyBps,
            sale_,
            merkleRoot_,
            feeReceiver,
            feeBps
        );
        
        // Transfer ownership to the creator
        IHyperLaunchERC721(drop).transferOwnership(msg.sender);
        
        // Track deployment
        creatorDrops[msg.sender].push(drop);
        allDrops.push(drop);
        
        emit DropDeployed(msg.sender, drop, salt);
    }

    function predictDeterministicAddress(bytes32 salt) external view returns (address) {
        return _predictDeterministicAddress(implementation, salt);
    }

    // Admin functions
    function updatePlatformFee(address receiver, uint96 bps) external onlyOwner {
        if (receiver == address(0)) revert InvalidConfiguration();
        if (bps > 1000) revert InvalidConfiguration(); // Max 10%
        
        // Avoid redundant storage writes
        if (platformFeeReceiver != receiver) {
            platformFeeReceiver = receiver;
        }
        if (platformFeeBps != bps) {
            platformFeeBps = bps;
        }
        
        emit PlatformFeeUpdated(receiver, bps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidConfiguration();
        
        address oldOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    function renounceOwnership() external onlyOwner {
        address oldOwner = owner;
        owner = address(0);
        
        emit OwnershipTransferred(oldOwner, address(0));
    }

    // View functions
    function getCreatorDrops(address creator) external view returns (address[] memory) {
        return creatorDrops[creator];
    }

    function getAllDropsCount() external view returns (uint256) {
        return allDrops.length;
    }

    function getDropsPaginated(uint256 offset, uint256 limit) external view returns (address[] memory drops) {
        uint256 total = allDrops.length;
        if (offset >= total) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        drops = new address[](length);
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                drops[i] = allDrops[offset + i];
            }
        }
    }

    // EIP-1167 Minimal Proxy implementation
    function _clone(address target) private returns (address result) {
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), shl(0x60, target))
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
    }

    function _cloneDeterministic(address target, bytes32 salt) private returns (address result) {
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), shl(0x60, target))
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create2(0, clone, 0x37, salt)
        }
    }

    function _predictDeterministicAddress(address target, bytes32 salt) private view returns (address predicted) {
        assembly {
            // Build minimal proxy init code in memory exactly as in _cloneDeterministic
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, target))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

            // keccak256 of init code (length 0x37 bytes starting at ptr)
            let initcodeHash := keccak256(ptr, 0x37)

            // Compute create2 address: keccak256(0xff ++ address(this) ++ salt ++ keccak256(init_code))[12:]
            let data := mload(0x40)
            mstore(data, 0xff00000000000000000000000000000000000000000000000000000000000000)
            mstore8(data, 0xff)
            mstore(add(data, 0x01), shl(0x60, address()))
            mstore(add(data, 0x15), salt)
            mstore(add(data, 0x35), initcodeHash)

            predicted := keccak256(data, 0x55)
            predicted := and(predicted, 0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff)
        }
    }
}