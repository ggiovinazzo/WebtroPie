<?php

// recursively convert xml obj to associative array

// <view name="system">...</view> converts to
// to obj + attributes + children to
// ['view']['system'] = ...

// <path>./art/logo.svg</path> converts to
// to obj + value to
// ['path'] = './art/logo.csv'

function merge_arrays(&$target, &$source)
{
    foreach ($source as $key => $value)
    {
        if(!isset($target[$key]))
        {
            $target[$key] = $value;
        }
        elseif(gettype($target[$key])=='array' &&
                        gettype($value)=='array')
        {
            merge_arrays($target[$key], $value);
        }
        else if($key!='index')  // overwrite
        {
            $target[$key] = $value;
        }
    }
}

function xmlobj_to_array($xmlobj, $tier)
{
    global $array_types, $index_types;
    static $tier_counts;

    if (!$xmlobj)
        return;

    if (gettype($xmlobj)=='array')
        return $xmlobj;

    $arr = array();

    if($tier==0)
        $tier_counts = array();

    if(!isset($tier_counts[$tier]))
        $tier_counts[$tier] = 0;

    foreach ($xmlobj->children() as $xmlchild)
    {
        $type = $xmlchild->getName();
        if ($type=='bool')
        {
            $arr[$xmlchild['name']->__toString()] = ($xmlchild['value']->__toString() == 'true');
            continue;
        }
        elseif ($type=='int' || $type=='float' || $type=='string')
        {
            $arr[$xmlchild['name']->__toString()] = $xmlchild['value']->__toString();
            continue;
        }

        if (!isset($arr[$type]))
        {
            $arr[$type] = array();
        }

        // convert child to either another object or a string if it has no children
        $name = $xmlchild['name'];  // attribute name ?
        //if($name==null) $name = $xmlchild->name; // child node name ?
        if ($name!=null) $name = $name->__toString();

        if ($xmlchild->count()>0)
        {
            $child = xmlobj_to_array($xmlchild, $tier+1);

            if (isset($index_types[$type])) {
                $child['index'] = $tier_counts[$tier]++;
            }

            foreach ($xmlchild->attributes() as $key => $val)
                $child[$key] = $val->__toString();
        }
        else
            $child = trim($xmlchild->__toString());  // no children so just use string

        if ($name)
        {
            if (!isset($arr[$type][$name])) // should be always
            {
                $arr[$type][$name] = $child;
            }
            elseif(gettype($arr[$type][$name])=='array' &&
                   gettype($child)=='array')
            {
                unset($child['index']);
                merge_arrays($arr[$type][$name], $child);
            }
        }
        elseif (isset($array_types[$type]))
            $arr[$type][] = $child;
        else
            $arr[$type] = $child;
    }

    return $arr;
}

// wrap tag around whole xml (after the header)
// ( simpleXML doesn't like xml with no start/end tags )
function wrap_xml($xml, $tag='wrapped')
{
    return preg_replace( '/^(<\?xml[^>]*>)/', '$1'
            ."\n<".$tag.">", // start tag
                $xml)
            ."\n</".$tag.">"; // end tag
}

// remove comments
// ( simpleXML doesn't like multiple hyphens like <!--- this ---> )
function strip_comments($xml)
{
    return preg_replace('/^[^<]*/','',
           preg_replace('/<!--(.*)-->/Uis', '', $xml));
}

function simplexml_load_file_wrapped($filename, $wrap_tag='wrapped')
{
    return new SimpleXMLElement(
                 wrap_xml(file_get_contents($filename),$wrap_tag));
}

function simplexml_load_file_strip_comments($filename, $utf8_encode)
{
    try
    {
        if ($utf8_encode)
        {
            return new SimpleXMLElement(utf8_encode(strip_comments(file_get_contents($filename))));
        }
        else
        {
            return new SimpleXMLElement(strip_comments(file_get_contents($filename)));
        }
    }
    catch (Exception $e)
    {
        return array("filename"=>$filename, "error"=>$e->getMessage());
    }
}

function unwrap_xml($filename, $wrap_tag='wrapped')
{
    // load file to string
    $xmlstr = file_get_contents($filename);
    // remove start/end tags
    $xmlstr = preg_replace("|</*$wrap_tag>|",'',$xmlstr);
    // remove blank lines
    $xmlstr = preg_replace("/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/", "\n", $xmlstr);
    //save
    file_put_contents($filename,$xmlstr);
}

function simplexml_save_file_unwrapped($xml, $filename, $wrap_tag='wrapped')
{
    // save full xml
    $xml->asXml($filename.'.tmp');
    // remove start end tags to temp file
    unwrap_xml($filename.'.tmp', $wrap_tag);
    // overwrite real file with temp file
    rename($filename.'.tmp',$filename);
}

function load_file_xml_as_array($filename, $wrap_tag='', $utf8_encode=false, $arrays=null, $index=null)
{
    global $array_types, $index_types;

    if ($arrays)
    {
        $array_types = $arrays;
    }
    if ($index)
    {
        $index_types = $index;
    }

    if (!file_exists($filename)) {
        return array("error" => "file $filename does not exist");
    }
    if ($wrap_tag)
    {
        return xmlobj_to_array(simplexml_load_file_wrapped($filename, 'tag'), 0);
    }
    else
    {
        return xmlobj_to_array(simplexml_load_file_strip_comments($filename,$utf8_encode), 0);
    }
}

function simplify_path($path, $directory=null)
{
    // simplify "/./" to "/"
    $path = str_replace('/./','/',$path);

    // simplify "/dir/.." to "/"
    $path = preg_replace('|[^/\.]+/\.\./|','',$path);
    $path = preg_replace('|[^/\.]+/\.\./|','',$path);
    $path = preg_replace('|[^/\.]+/\.\./|','',$path);

    // simplify "/./" to "/"
    $path = str_replace('/./','/',$path);

    if (substr($path,0,2)=='./')
    {
        $path = substr($path,2);
    }

    if ($directory)
    {
        if (substr($path,0,1)=='~')
        {
            $path = HOME.substr($path,1);
        }

        if (substr($path, 0, $l=strlen($directory)) == $directory)
        {
            $path = substr($path,$l);
        }
    }

    return $path;
}

?>
