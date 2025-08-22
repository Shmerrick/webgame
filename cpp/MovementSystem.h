#ifndef MOVEMENTSYSTEM_H
#define MOVEMENTSYSTEM_H

#include "DataTypes.h"
#include <cmath>
#include <algorithm>

namespace Game {

class MovementSystem {
public:
    // Constants from the "Movement System" document
    static constexpr double SPRINT_RAMP_UP_TIME = 2.0;
    static constexpr int SPRINT_ENGAGE_COST = 5;
    static constexpr double BACKPEDAL_MODIFIER = -0.25;
    static constexpr int CLAMBER_COST = 5;
    static constexpr double QUICK_TURN_COST = 20.0;
    static constexpr double TERMINAL_VELOCITY = 55.0; // m/s
    static constexpr double MIN_FLOOR_SPEED = 0.5; // m/s

    // Calculates the player's current speed based on their state and environment.
    static double CalculateCurrentSpeed(
        PlayerState state,
        PlayerPosture posture,
        double baseSpeed,
        double slopeAngle, // in degrees
        bool isBackpedaling
    ) {
        double speed = baseSpeed;

        // This is a simplified placeholder for a full speed matrix.
        // A full implementation would have a data table mapping posture to speed modifiers.
        // switch(posture) { ... }

        // Apply state modifiers
        if (state == PlayerState::InCombat) {
            speed *= 0.5; // "Movement speed halved"
        }

        // Apply backpedal modifier
        if (isBackpedaling) {
            speed *= (1.0 + BACKPEDAL_MODIFIER);
        }

        // Apply slope effects (simplified linear reduction for uphill)
        if (slopeAngle > 20.0 && slopeAngle <= 45.0) {
            // Reduce speed by up to 45% based on slope
            double reduction = (slopeAngle - 20.0) / 25.0 * 0.45;
            speed *= (1.0 - reduction);
        } else if (slopeAngle > 45.0) {
            speed *= (1.0 - 0.45);
        }

        return std::max(MIN_FLOOR_SPEED, speed);
    }

    // Provides a basic framework for the anti-cheat system.
    static bool IsSpeedAnomalous(
        double currentSpeed,
        PlayerState state
        // In a real system, this would also take player buffs/debuffs into account.
    ) {
        // This would check against a detailed speed matrix for the given state.
        double maxSpeedForState = 10.0; // Placeholder value
        double tolerance = 1.10; // 10% tolerance for latency, etc.

        return currentSpeed > (maxSpeedForState * tolerance);
    }
};

} // namespace Game

#endif // MOVEMENTSYSTEM_H
