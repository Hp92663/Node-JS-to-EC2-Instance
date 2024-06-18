# Node-JS-to-EC2-Instance


Simple deployments on Cloud

## Step 1: Install NodeJS and NPM using nvm
Install node version manager (nvm) by typing the following at the command line.

```bash
sudo su -
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
```
Activate nvm by typing the following at the command line.

```bash
. ~/.nvm/nvm.sh
```

Use nvm to install the latest version of Node.js by typing the following at the command line.

```bash
nvm install node
```

Test that node and npm are installed and running correctly by typing the following at the terminal:

```bash
node -v
npm -v
```

## Step 2: Install Git and clone repository from GitHub
To install git, run below commands in the terminal window:

```bash
sudo apt-get update -y
sudo apt-get install git -y
```

Just to verify if system has git installed or not, please run below command in terminal:
```bash
git — version
```

This command will print the git version in the terminal.

Run below command to clone the code repository from Github:

```bash
git clone https://github.com/Hp92663/Node-JS-to-EC2-Instance.git
```

Get inside the directory and Install Packages

```bash
cd nodejs-on-ec2
npm install
```

Start the application
To start the application, run the below command in the terminal:

```bash
npm start
```

```bash
<div class="container-fluid py-3">
  <h5 class="card-title fw-semibold mb-2 text-center">Add User</h5>
  <div class="card">
    <div class="card-body">
      <form #addUser="ngForm" novalidate>
        
        <div class="row mb-3">
          <div class="col-md-3">
            <label class="h5 mb-1">Select Organization Type</label>
            <div class="dropdown mb-2">
              <select
                class="form-control dropdown-toggle"
                ngModel
                #organizationType="ngModel"
                name="organizationType"
                required
              >
                <option value="" disabled selected hidden>Select Organization Type</option>
                <!-- Options for organization type -->
              </select>
              <div *ngIf="!organizationType.valid && addUser.submitted" class="text-danger">
                Select Organization Type is required!
              </div>
            </div>

            <label class="h5 mb-1">Select Marketplace Bank</label>
            <div class="dropdown">
              <select
                class="form-control dropdown-toggle"
                ngModel
                #marketplace="ngModel"
                name="marketplace"
                required
              >
                <option value="" disabled selected hidden>Select Marketplace Bank</option>
                <!-- Options for marketplace bank -->
              </select>
              <div *ngIf="!marketplace.valid && addUser.submitted" class="text-danger">
                Select Marketplace Bank is required!
              </div>
            </div>
          </div>
          

          <div class="col-md-3"></div>
          <div class="col-md-6"></div>

        </div>

        <div class="row mb-3">
          <div class="col-md-4">
            <label for="role">Role *</label>
            <select class="form-control dropdown-toggle" ngModel #role="ngModel" name="role" required>
              <option value="" disabled selected hidden>Select Role</option>
            </select>
            <div *ngIf="!role.valid && addUser.submitted" class="text-danger">
              Role is required!
            </div>
          </div>

          <div class="col-md-4">
            <label for="email">Email *</label>
            <input class="form-control" type="email" ngModel #email="ngModel" name="email" required />
            <div *ngIf="!email.valid && addUser.submitted" class="text-danger">
              Email is required!
            </div>
          </div>

          <div class="col-md-4">
            <label for="mobileNo">Mobile *</label>
            <input class="form-control" type="number" ngModel #mobileNo="ngModel" name="mobileNo" required />
            <div *ngIf="!mobileNo.valid && addUser.submitted" class="text-danger">
              Mobile Number is required!
            </div>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-4">
            <label>First Name *</label>
            <input class="form-control" ngModel #fName="ngModel" name="fName" required />
            <div *ngIf="!fName.valid && addUser.submitted" class="text-danger">
              First Name is required!
            </div>
          </div>

          <div class="col-md-4">
            <label for="mName">Middle Name *</label>
            <input class="form-control" type="text" ngModel #mName="ngModel" name="mName" required />
            <div *ngIf="!mName.valid && addUser.submitted" class="text-danger">
              Middle Name is required!
            </div>
          </div>

          <div class="col-md-4">
            <label for="lName">Last Name *</label>
            <input class="form-control" type="text" ngModel #lName="ngModel" name="lName" required />
            <div *ngIf="!lName.valid && addUser.submitted" class="text-danger">
              Last Name is required!
            </div>
          </div>
        </div>

        <div class="row mt-2">
          <div class="col-md-1">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
          <div class="col-md-1">
            <button type="button" class="btn btn-secondary" routerLink="/admin/list-product">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
<simple-notifications [options]="{ position: ['top', 'center'], maxStack: 1 }"></simple-notifications>
```
