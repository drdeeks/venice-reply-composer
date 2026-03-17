#!/usr/bin/env node

/**
 * Test setup file for Foundry
 */

// Import standard foundry testing
import { Test, assertEq } from 'forge-std/Test.sol';
import { console2 } from 'forge-std/console2.sol';

// Import the main contract for testing
import { RevenueShareHook } from '../src/RevenueShareHook.sol';
import { MockSliceSplitter } from '../contracts/mocks/MockSliceSplitter.sol';

// Global test variables
RevenueShareHook public hook;
MockSliceSplitter public sliceSplitter;
address public owner;
address public alice;
address public bob;
address public charlie;

// Constants for common fee percentages
uint256 public constant FEE_5_BASIS_POINTS = 500; // 5%
uint256 public constant FEE_10_BASIS_POINTS = 1000; // 10%
uint256 public constant FEE_1_BASIS_POINTS = 100; // 1%

// Setup function - runs before each test
function setUp() public {
    // Initialize test accounts
    owner = address(0x1);
    alice = address(0xA);
    bob = address(0xB);
    charlie = address(0xC);
    
    // Deploy mock Slice splitter
    sliceSplitter = new MockSliceSplitter();
    
    // Add default contributors for testing
    sliceSplitter.addContributor(alice, 4000); // 40%
    sliceSplitter.addContributor(bob, 3000);   // 30%
    sliceSplitter.addContributor(charlie, 3000); // 30%
    
    // Deploy hook with owner and initial configuration
    hook = new RevenueShareHook(owner);
    hook.setPaymentSplitter(address(sliceSplitter));
    hook.setFeePercentage(FEE_5_BASIS_POINTS);
}

// Helper functions for tests
function assertRevertWithMessage(string memory expectedMessage) {
    // This would be used in tests to assert reverts
    // Implementation depends on foundry version
}

function assertEventEmitted(
    bytes32 eventName,
    bytes[] memory topics,
    bytes memory data
) {
    // Event emission assertion
    // Implementation depends on foundry version
}

// Example test - actual tests are in test/ directory
contract TestExample is Test {
    function test_Example() public {
        // Basic assertion example
        assertEq(1, 1);
        console.log("Test example passed");
    }
}