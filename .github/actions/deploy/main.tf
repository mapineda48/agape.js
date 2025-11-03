provider "azurerm" {
  features {}
}

data "external" "cloudinit_dyn" {
  program = ["bash", "${path.module}/scripts/cloud-init.tpl.sh"]
  query = {  }
}

resource "azurerm_resource_group" "agape_app" {
  name     = var.resource_group_name
  location = var.resource_group_location
}

resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-deploy"
  location            = var.resource_group_location
  resource_group_name = azurerm_resource_group.agape_app.name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "subnet" {
  name                 = "subnet-deploy"
  resource_group_name  = azurerm_resource_group.agape_app.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_public_ip" "public_ip" {
  name                = "public-ip"
  location            = azurerm_resource_group.agape_app.location
  resource_group_name = azurerm_resource_group.agape_app.name
  allocation_method   = "Static"
  sku                 = "Basic"
}

resource "azurerm_network_interface" "nic" {
  name                = "nic-deploy"
  location            = azurerm_resource_group.agape_app.location
  resource_group_name = azurerm_resource_group.agape_app.name

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.public_ip.id
  }
}

resource "azurerm_network_security_group" "nsg" {
  name                = "nsg-deploy"
  location            = azurerm_resource_group.agape_app.location
  resource_group_name = azurerm_resource_group.agape_app.name

  security_rule {
    name                       = "Allow-HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-HTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  dynamic "security_rule" {
    for_each = var.SOURCE_IP != "" && var.SOURCE_IP != null ? [1] : []

    content {
      name                       = "Allow-SSH-From-MyIP"
      priority                   = 120
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "22"
      source_address_prefix      = var.SOURCE_IP
      destination_address_prefix = "*"
    }
  }
}

resource "azurerm_subnet_network_security_group_association" "subnet_nsg_assoc" {
  subnet_id                 = azurerm_subnet.subnet.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

locals {
  public_key = try(file("~/.ssh/id_ed25519.pub"), var.SSH_PUBLIC_KEY)
}


resource "azurerm_linux_virtual_machine" "vm" {
  name                = "mapineda48"
  location            = azurerm_resource_group.agape_app.location
  resource_group_name = azurerm_resource_group.agape_app.name
  size                = var.VM_SIZE
  admin_username      = "azureuser"

  network_interface_ids = [azurerm_network_interface.nic.id]

  admin_ssh_key {
    username   = "azureuser"
    public_key = local.public_key
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

  custom_data = base64encode(data.external.cloudinit_dyn.result.rendered)

  disable_password_authentication = true
}

resource "azurerm_dns_a_record" "subdomains" {
  name                = var.subdomain
  zone_name           = var.dns_zone_name
  resource_group_name = var.resource_group_name_mapineda48
  ttl                 = 300
  records             = [azurerm_public_ip.public_ip.ip_address]
}
