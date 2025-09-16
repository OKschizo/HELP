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

// Use UPGRADEABLE versions of all OpenZeppelin contracts
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title HyperLaunchERC721_ImplV2
 * @notice Implementation contract for HyperLaunch NFT collections
 * @dev Uses EIP-1167 minimal proxy pattern for gas-efficient deployments
 */
contract HyperLaunchERC721_ImplV2 is 
    Initializable,
    ERC721EnumerableUpgradeable,
    ERC2981Upgradeable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // Sale configuration
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

    // State variables
    uint256 public maxSupply;
    string public baseURI;
    address public payoutAddress;
    Sale public saleConfig;
    bytes32 public merkleRoot;
    
    // Platform fee configuration
    address public platformFeeReceiver;
    uint96 public platformFeeBps;
    
    // Minting tracking
    mapping(address => uint256) public mintedPerWallet;
    
    // Merkle proof tracking to prevent reuse
    mapping(bytes32 => bool) public usedProofs;
    
    // Constants
    uint96 private constant MAX_ROYALTY_BPS = 1000; // 10% max
    uint96 private constant MAX_PLATFORM_FEE_BPS = 1000; // 10% max
    
    // Events
    event Minted(address indexed to, uint256 indexed tokenId, uint256 price);
    event Withdrawn(uint256 creatorAmount, uint256 platformAmount);
    event SaleConfigUpdated(Sale sale);
    event BaseURIUpdated(string baseURI);
    event MerkleRootUpdated(bytes32 merkleRoot);
    event PayoutAddressUpdated(address payout);
    event ProofUsed(bytes32 indexed proofHash, address indexed user);

    // Errors
    error InvalidConfiguration();
    error SaleNotActive();
    error ExceedsMaxSupply();
    error ExceedsMaxPerWallet();
    error ExceedsMaxPerTx();
    error InvalidPayment();
    error InvalidProof();
    error WithdrawFailed();
    error TokenDoesNotExist();
    error AllowlistNotActive();
    error ProofAlreadyUsed();

    // Constructor - disable initializers for implementation contract
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // Two-step initialization to avoid stack too deep
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
    ) external initializer {
        // Store Sale struct first (pass by reference)
        saleConfig = sale_;
        
        // Initialize contracts with minimal parameters
        __ERC721_init(name_, symbol_);
        __ERC721Enumerable_init();
        __Ownable2Step_init();
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __ERC2981_init();
        
        // Continue initialization
        _completeInitialization(
            maxSupply_,
            baseURI_,
            payout_,
            royaltyReceiver,
            royaltyBps,
            merkleRoot_,
            platformFeeReceiver_,
            platformFeeBps_
        );
    }
    
    function _completeInitialization(
        uint256 maxSupply_,
        string memory baseURI_,
        address payout_,
        address royaltyReceiver,
        uint96 royaltyBps,
        bytes32 merkleRoot_,
        address platformFeeReceiver_,
        uint96 platformFeeBps_
    ) private {
        // Validations
        require(payout_ != address(0), "Invalid payout");
        require(royaltyReceiver != address(0), "Invalid royalty receiver");
        require(platformFeeReceiver_ != address(0), "Invalid platform receiver");
        require(royaltyBps <= MAX_ROYALTY_BPS, "Royalty too high");
        require(platformFeeBps_ <= MAX_PLATFORM_FEE_BPS, "Platform fee too high");
        require(maxSupply_ != 0, "Invalid max supply");
        
        // Set state
        maxSupply = maxSupply_;
        baseURI = baseURI_;
        payoutAddress = payout_;
        merkleRoot = merkleRoot_;
        platformFeeReceiver = platformFeeReceiver_;
        platformFeeBps = platformFeeBps_;
        
        // Set royalties
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    // ============ Minting Functions ============

    function mintPublic(uint32 quantity) external payable nonReentrant whenNotPaused {
        Sale memory sale = saleConfig; // Cache storage read
        
        // Check public sale is active
        require(
            block.timestamp >= sale.publicStart && 
            (sale.publicEnd == 0 || block.timestamp <= sale.publicEnd),
            "Sale not active"
        );
        
        _processMint(
            msg.sender, 
            quantity, 
            sale.publicPriceWei, 
            sale.maxPerTx, 
            sale.maxPerWallet
        );
    }

    function mintAllowlist(
        uint32 quantity,
        bytes32[] calldata proof
    ) external payable nonReentrant whenNotPaused {
        Sale memory sale = saleConfig; // Cache storage read
        bytes32 cachedMerkleRoot = merkleRoot; // Cache storage read
        
        // Check if merkle root is set (allowlist exists)
        if (cachedMerkleRoot == bytes32(0)) revert AllowlistNotActive();
        
        // Check allowlist sale is active
        require(
            sale.allowlistStart != 0 &&
            block.timestamp >= sale.allowlistStart && 
            (sale.allowlistEnd == 0 || block.timestamp <= sale.allowlistEnd),
            "Allowlist sale not active"
        );
        
        // Create proof hash to prevent reuse
        bytes32 proofHash = keccak256(abi.encode(msg.sender, proof));
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed();
        }
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(proof, cachedMerkleRoot, leaf)) {
            revert InvalidProof();
        }
        
        // Mark proof as used
        usedProofs[proofHash] = true;
        emit ProofUsed(proofHash, msg.sender);
        
        _processMint(
            msg.sender, 
            quantity, 
            sale.allowlistPriceWei, 
            sale.maxPerTx, 
            sale.maxPerWallet
        );
    }

    function mintOwner(address to, uint32 quantity) external onlyOwner {
        // Add zero check
        if (quantity == 0) revert InvalidConfiguration();
        
        uint256 currentSupply = totalSupply();
        if (currentSupply + quantity > maxSupply) revert ExceedsMaxSupply();
        
        // Gas optimization: cache tokenId
        for (uint256 i = 0; i < quantity;) {
            uint256 tokenId = currentSupply + i;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId, 0);
            
            unchecked {
                ++i;
            }
        }
    }

    function _processMint(
        address to,
        uint32 quantity,
        uint256 pricePerToken,
        uint32 maxPerTx,
        uint32 maxPerWallet
    ) private {
        // Validations
        if (quantity == 0) revert InvalidConfiguration();
        if (quantity > maxPerTx) revert ExceedsMaxPerTx();
        if (mintedPerWallet[to] + quantity > maxPerWallet) revert ExceedsMaxPerWallet();
        
        uint256 currentSupply = totalSupply();
        if (currentSupply + quantity > maxSupply) revert ExceedsMaxSupply();
        
        uint256 totalPrice = pricePerToken * quantity;
        if (msg.value != totalPrice) revert InvalidPayment();
        
        // Update minted count
        mintedPerWallet[to] = mintedPerWallet[to] + quantity;
        
        // Mint tokens - gas optimized
        for (uint256 i = 0; i < quantity;) {
            uint256 tokenId = currentSupply + i;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId, pricePerToken);
            
            unchecked {
                ++i;
            }
        }
    }

    // ============ Admin Functions ============

    function withdraw() external payable onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        uint256 platformFee = (balance * platformFeeBps) / 10000;
        uint256 creatorAmount = balance - platformFee;
        
        // Transfer platform fee
        if (platformFee != 0) {
            (bool platformSuccess, ) = platformFeeReceiver.call{value: platformFee}("");
            if (!platformSuccess) revert WithdrawFailed();
        }
        
        // Transfer creator amount
        (bool creatorSuccess, ) = payoutAddress.call{value: creatorAmount}("");
        if (!creatorSuccess) revert WithdrawFailed();
        
        emit Withdrawn(creatorAmount, platformFee);
    }

    function updateSaleConfig(Sale memory sale_) external payable onlyOwner {
        saleConfig = sale_;
        emit SaleConfigUpdated(sale_);
    }

    function updateBaseURI(string memory baseURI_) external payable onlyOwner {
        // Validate baseURI ends with '/' for proper tokenURI concatenation
        if (bytes(baseURI_).length > 0) {
            require(
                bytes(baseURI_)[bytes(baseURI_).length - 1] == bytes1('/'),
                "BaseURI must end with '/'"
            );
        }
        baseURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function updateMerkleRoot(bytes32 merkleRoot_) external payable onlyOwner {
        merkleRoot = merkleRoot_;
        emit MerkleRootUpdated(merkleRoot_);
    }

    function updatePayoutAddress(address payout_) external payable onlyOwner {
        if (payout_ == address(0)) revert InvalidConfiguration();
        payoutAddress = payout_;
        emit PayoutAddressUpdated(payout_);
    }

    function setDefaultRoyalty(address receiver, uint96 bps) external payable onlyOwner {
        if (receiver == address(0)) revert InvalidConfiguration();
        if (bps > MAX_ROYALTY_BPS) revert InvalidConfiguration();
        _setDefaultRoyalty(receiver, bps);
    }

    function pause() external payable onlyOwner {
        _pause();
    }

    function unpause() external payable onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable) returns (string memory) {
        // Check if token exists
        require(tokenId < totalSupply(), "Token does not exist");
        
        string memory base = _baseURI();
        return bytes(base).length != 0 ? string(bytes.concat(bytes(base), bytes(_toString(tokenId)))) : "";
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721EnumerableUpgradeable, ERC2981Upgradeable) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}