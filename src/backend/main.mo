import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import List "mo:core/List";
import Option "mo:core/Option";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    username : Text;
    email : Text;
    role : Text; // "admin" or "agent"
    registeredAt : Int;
    isActive : Bool;
    lastActivity : Int;
  };

  // User session management
  type Session = {
    userId : Principal;
    token : Text;
    createdAt : Int;
    expiresAt : Int;
  };

  type Quote = {
    id : Nat;
    userId : Principal;
    clientName : Text;
    clientAge : Nat;
    clientEmail : Text;
    planId : Nat;
    planName : Text;
    coverageAmount : Nat;
    monthlyPremium : Nat;
    status : { #pending; #paid };
    agentName : Text;
    createdAt : Int;
    paidAt : ?Int;
  };

  type InsurancePlan = {
    id : Nat;
    name : Text;
    description : Text;
    benefits : [Text];
    coverageAmount : Nat;
    monthlyPremium : Nat;
  };

  type AdminStats = {
    totalUsers : Nat;
    totalQuotes : Nat;
    pendingQuotes : Nat;
    paidQuotes : Nat;
    activeUsers : Nat;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Text, Session>();
  let plans = Map.empty<Nat, InsurancePlan>();
  let recordedQuotes = Map.empty<Nat, Quote>();

  var currentQuoteId = 0;
  var currentPlanId = 3;
  var sessionCounter = 0;

  // Helper function to generate session token
  func generateSessionToken(userId : Principal) : Text {
    sessionCounter += 1;
    let timestamp = Time.now().toText();
    let counter = sessionCounter.toText();
    let principalText = userId.toText();
    principalText # "-" # timestamp # "-" # counter;
  };

  // Helper function to hash password (simplified)
  func hashPassword(password : Text) : Text {
    // In production, use proper cryptographic hashing
    "hashed_" # password;
  };

  // User Profile Functions (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    
    // Update last activity
    let updatedProfile = {
      profile with
      lastActivity = Time.now();
    };
    userProfiles.add(caller, updatedProfile);
  };

  // User Management Functions
  public shared ({ caller }) func register(username : Text, email : Text, password : Text, role : Text) : async Principal {
    if (role != "admin" and role != "agent") {
      Runtime.trap("Invalid role: must be 'admin' or 'agent'");
    };

    let profile : UserProfile = {
      username;
      email;
      role;
      registeredAt = Time.now();
      isActive = true;
      lastActivity = Time.now();
    };

    userProfiles.add(caller, profile);

    // Assign role in access control system
    let accessRole = if (role == "admin") { #admin } else { #user };
    AccessControl.assignRole(accessControlState, caller, caller, accessRole);

    caller;
  };

  public shared ({ caller }) func login(username : Text, password : Text) : async Text {
    // Find user by username
    var foundUser : ?Principal = null;
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.username == username) {
        foundUser := ?principal;
      };
    };

    switch (foundUser) {
      case (null) {
        Runtime.trap("Invalid credentials");
      };
      case (?userId) {
        let profile = switch (userProfiles.get(userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?p) { p };
        };

        if (not profile.isActive) {
          Runtime.trap("User account is inactive");
        };

        // Create session
        let token = generateSessionToken(userId);
        let session : Session = {
          userId;
          token;
          createdAt = Time.now();
          expiresAt = Time.now() + 86400_000_000_000; // 24 hours in nanoseconds
        };
        sessions.add(token, session);

        // Update last activity
        let updatedProfile = {
          profile with
          lastActivity = Time.now();
        };
        userProfiles.add(userId, updatedProfile);

        token;
      };
    };
  };

  public shared ({ caller }) func logout(token : Text) : async Bool {
    sessions.remove(token);
    true;
  };

  public query func validateSession(token : Text) : async ?(Principal, Text) {
    switch (sessions.get(token)) {
      case (null) { null };
      case (?session) {
        if (Time.now() > session.expiresAt) {
          null;
        } else {
          let profile = switch (userProfiles.get(session.userId)) {
            case (null) { null };
            case (?p) { ?p };
          };
          switch (profile) {
            case (null) { null };
            case (?p) { ?(session.userId, p.role) };
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.values().toArray();
  };

  public query ({ caller }) func getUserById(userId : Principal) : async ?UserProfile {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user details");
    };
    userProfiles.get(userId);
  };

  public shared ({ caller }) func updateUserRole(userId : Principal, newRole : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update user roles");
    };

    if (newRole != "admin" and newRole != "agent") {
      Runtime.trap("Invalid role: must be 'admin' or 'agent'");
    };

    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) {
        let updatedProfile = {
          profile with
          role = newRole;
        };
        userProfiles.add(userId, updatedProfile);

        // Update access control role
        let accessRole = if (newRole == "admin") { #admin } else { #user };
        AccessControl.assignRole(accessControlState, caller, userId, accessRole);

        true;
      };
    };
  };

  public shared ({ caller }) func setUserActive(userId : Principal, isActive : Bool) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can activate/deactivate users");
    };

    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) {
        let updatedProfile = {
          profile with
          isActive;
        };
        userProfiles.add(userId, updatedProfile);
        true;
      };
    };
  };

  // Insurance Plan Functions
  public query func getPlans() : async [InsurancePlan] {
    // Public access - anyone can view plans
    plans.values().toArray();
  };

  public shared ({ caller }) func addInsurancePlan(name : Text, description : Text, benefits : [Text], coverageAmount : Nat, monthlyPremium : Nat) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add insurance plans");
    };

    currentPlanId += 1;
    let plan : InsurancePlan = {
      id = currentPlanId;
      name;
      description;
      benefits;
      coverageAmount;
      monthlyPremium;
    };

    plans.add(plan.id, plan);
    plan.id;
  };

  // Quote Functions
  public shared ({ caller }) func createQuote(clientName : Text, clientAge : Int, clientEmail : Text, planId : Nat) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot create quotes");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create quotes");
    };

    let userProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) { p };
    };

    if (not userProfile.isActive) {
      Runtime.trap("User account is inactive");
    };

    let plan = switch (plans.get(planId)) {
      case (null) { Runtime.trap("Plan not found") };
      case (?p) { p };
    };

    let newQuote : Quote = {
      id = currentQuoteId;
      userId = caller;
      clientName;
      clientAge = Int.abs(clientAge);
      clientEmail;
      planId;
      planName = plan.name;
      coverageAmount = plan.coverageAmount;
      monthlyPremium = plan.monthlyPremium;
      status = #pending;
      agentName = userProfile.username;
      createdAt = Time.now();
      paidAt = null;
    };

    currentQuoteId += 1;
    recordedQuotes.add(newQuote.id, newQuote);

    // Update user last activity
    let updatedProfile = {
      userProfile with
      lastActivity = Time.now();
    };
    userProfiles.add(caller, updatedProfile);

    newQuote.id;
  };

  public shared ({ caller }) func getQuotesByUser(userId : Principal) : async [Quote] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view quotes");
    };
    
    // Users can only view their own quotes, admins can view any
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own quotes");
    };

    let userQuotes = recordedQuotes.values().toArray().filter(
      func(quote) { quote.userId == userId }
    );
    userQuotes;
  };

  public query ({ caller }) func getAllQuotes() : async [Quote] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all quotes");
    };
    recordedQuotes.values().toArray();
  };

  public shared ({ caller }) func markQuotePaid(quoteId : Nat) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark quotes as paid");
    };

    switch (recordedQuotes.get(quoteId)) {
      case (null) { false };
      case (?quote) {
        let paidQuote = {
          quote with
          status = #paid;
          paidAt = ?Time.now();
        };
        recordedQuotes.add(quoteId, paidQuote);
        true;
      };
    };
  };

  public query ({ caller }) func getAdminStats() : async AdminStats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view statistics");
    };

    let allQuotes = recordedQuotes.values().toArray();
    let pendingCount = allQuotes.filter(func(q) { 
      switch (q.status) {
        case (#pending) { true };
        case (#paid) { false };
      };
    }).size();
    let paidCount = allQuotes.filter(func(q) { 
      switch (q.status) {
        case (#pending) { false };
        case (#paid) { true };
      };
    }).size();

    let allUsers = userProfiles.values().toArray();
    let activeCount = allUsers.filter(func(u) { u.isActive }).size();

    {
      totalUsers = allUsers.size();
      totalQuotes = allQuotes.size();
      pendingQuotes = pendingCount;
      paidQuotes = paidCount;
      activeUsers = activeCount;
    };
  };

  // Initialize default insurance plans
  let defaultPlans : [InsurancePlan] = [
    {
      id = 1;
      name = "TopHealth Gold";
      description = "Comprehensive health insurance plan";
      benefits = ["Full hospital coverage", "Dental and vision", "Prescription drugs", "Mental health services"];
      coverageAmount = 500_000;
      monthlyPremium = 4250;
    },
    {
      id = 2;
      name = "HealthPro Silver";
      description = "Affordable plan with great benefits";
      benefits = ["Hospital coverage", "Prescription drugs", "Emergency care"];
      coverageAmount = 250_000;
      monthlyPremium = 2750;
    },
    {
      id = 3;
      name = "BasicCare Bronze";
      description = "Entry-level insurance coverage";
      benefits = ["Basic hospital coverage", "Emergency care"];
      coverageAmount = 100_000;
      monthlyPremium = 1250;
    },
  ];

  for (plan in defaultPlans.vals()) {
    plans.add(plan.id, plan);
  };
};
