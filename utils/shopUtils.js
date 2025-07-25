import { arrayUnion, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "../firebaseConfig";

/**
 * Validates if a shop link is in the correct format
 * @param {string} link - The shop link to validate
 * @returns {boolean} - True if valid format
 */
export const validateShopLink = (link) => {
  if (!link || typeof link !== "string") return false;

  // For random shop links, just check if it's a non-empty string
  // You can add more specific validation here if needed
  const trimmedLink = link.trim();
  return trimmedLink.length > 0 && trimmedLink.length <= 50; // Reasonable length limit
};

/**
 * Extracts shop ID from shop link
 * @param {string} link - The shop link
 * @returns {string|null} - Shop ID or null if invalid
 */
export const extractShopIdFromLink = (link) => {
  try {
    // Since shop link is random and shop ID is same as owner UID,
    // the link itself might be the shop ID or contain it
    // Adjust this logic based on your actual link format
    const trimmedLink = link.trim();

    // If the link is just the shop ID
    return trimmedLink;
  } catch (error) {
    return null;
  }
};

/**
 * Joins a customer to a shop using shop link
 * @param {string} shopLink - The shop link
 * @param {string} customerUid - Customer's UID
 * @returns {Promise<{success: boolean, message: string, shopData?: object}>}
 */
export const joinShopByLink = async (shopLink, customerUid) => {
  try {
    // Validate link format
    if (!validateShopLink(shopLink)) {
      return {
        success: false,
        message: "Invalid shop link format. Please check the link and try again.",
      };
    }

    // Find shop by link
    const q = query(collection(db, "shops"), where("link", "==", shopLink));
    const shopSnap = await getDocs(q);

    if (shopSnap.empty) {
      return {
        success: false,
        message: "Shop not found. Please check the link and try again.",
      };
    }

    const shopDoc = shopSnap.docs[0];
    const shopId = shopDoc.id; // Use the shop document's ID (owner UID)
    const shopData = shopDoc.data();

    // Check if customer is already joined
    if (shopData.customers && shopData.customers.includes(customerUid)) {
      return {
        success: false,
        message: "You are already a member of this shop.",
      };
    }

    const shopRef = shopDoc.ref;
    // Add customer to shop's customers array
    await updateDoc(shopRef, {
      customers: arrayUnion(customerUid),
    });

    // Add shop's ID (owner UID) to customer's shopsJoined array
    const customerRef = doc(db, "customers", customerUid);
    await updateDoc(customerRef, {
      shopsJoined: arrayUnion(shopId),
    });

    return {
      success: true,
      message: `Successfully joined ${shopData.shopName || shopData.name || "the shop"}!`,
      shopData,
    };
  } catch (error) {
    console.error("Error joining shop:", error);
    return {
      success: false,
      message: "An error occurred while joining the shop. Please try again.",
    };
  }
};

/**
 * Shows an alert with join result
 * @param {object} result - Result from joinShopByLink
 * @param {function} onSuccess - Callback for successful join
 */
export const handleJoinResult = (result, onSuccess = null) => {
  if (result.success) {
    Alert.alert("Success!", result.message, [
      {
        text: "OK",
        onPress: onSuccess,
      },
    ]);
  } else {
    Alert.alert("Error", result.message);
  }
};
