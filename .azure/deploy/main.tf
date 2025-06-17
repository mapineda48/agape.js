provider "azurerm" {
  features {}
}

data "terraform_remote_state" "core" {
  backend = "azurerm"
  config = {
    resource_group_name  = "agape_app-rg"
    storage_account_name = "dedvx6qpkprsolhkkp1um9e1"
    container_name       = "tfstate"
    key                  = "core.tfstate"
  }
}

resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-deploy"
  location            = data.terraform_remote_state.core.outputs.resource_group_location
  resource_group_name = data.terraform_remote_state.core.outputs.resource_group_name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "subnet" {
  name                 = "subnet-deploy"
  resource_group_name  = data.terraform_remote_state.core.outputs.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_public_ip" "public_ip" {
  name                = "public-ip"
  location            = data.terraform_remote_state.core.outputs.resource_group_location
  resource_group_name = data.terraform_remote_state.core.outputs.resource_group_name
  allocation_method   = "Static"
  sku                 = "Basic"
}

resource "azurerm_network_interface" "nic" {
  name                = "nic-deploy"
  location            = data.terraform_remote_state.core.outputs.resource_group_location
  resource_group_name = data.terraform_remote_state.core.outputs.resource_group_name

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.public_ip.id
  }
}

resource "azurerm_linux_virtual_machine" "vm" {
  name                = "vm-deploy"
  location            = data.terraform_remote_state.core.outputs.resource_group_location
  resource_group_name = data.terraform_remote_state.core.outputs.resource_group_name
  size                = "Standard_B2s" # VM de 2 vCPU burstable económica
  admin_username      = "azureuser"

  network_interface_ids = [
    azurerm_network_interface.nic.id
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file("~/.ssh/id_rsa.pub") # Ajusta si tu clave está en otro lado
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    name                 = "osdisk-vm"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.tpl.yaml", {
    # Puedes agregar variables si necesitas
  }))

  disable_password_authentication = true
}

resource "azurerm_virtual_machine_data_disk_attachment" "certs_attachment" {
  managed_disk_id    = data.terraform_remote_state.core.outputs.persistent_data_disk_id
  virtual_machine_id = azurerm_linux_virtual_machine.vm.id
  lun                = 10
  caching            = "ReadOnly"
}
