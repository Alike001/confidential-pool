// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

import {DrawTranscript} from "../src/reference/DrawTranscript.sol";

contract DrawTranscriptTest {
    function testUniformPreservesSafeEntropy() public pure {
        // For upperBound = 10, entropy 6 is the first non-rejection value.
        require(DrawTranscript.uniform(6, 10) == 6, "safe entropy changed");
    }

    function testUniformResultIsInRange() public pure {
        uint256 result = DrawTranscript.uniform(123456789, 1000);
        require(result < 1000, "result out of range");
    }

    function testUserSpecificRandomIsDeterministicAndUserBound() public pure {
        uint256 first = DrawTranscript.userSpecificRandom(1, address(0x100), address(0x200), 2, 3, 4);
        uint256 repeat = DrawTranscript.userSpecificRandom(1, address(0x100), address(0x200), 2, 3, 4);
        uint256 differentUser = DrawTranscript.userSpecificRandom(1, address(0x100), address(0x201), 2, 3, 4);

        require(first == repeat, "transcript is not deterministic");
        require(first != differentUser, "user is absent from transcript");
    }
}
