import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    name : Text;
    employeeId : Text;
  };

  type NewUserProfileWithRole = {
    name : Text;
    role : Text;
    employeeId : Text;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfileWithRole>;
  };

  public func run(old : OldActor) : NewActor {
    let transformedProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfileWithRole>(
      func(_principal, oldProfile) {
        { oldProfile with role = "user" };
      }
    );
    {
      userProfiles = transformedProfiles;
    };
  };
};
