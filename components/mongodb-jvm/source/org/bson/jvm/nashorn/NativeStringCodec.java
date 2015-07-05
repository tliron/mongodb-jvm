/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

import jdk.nashorn.internal.objects.NativeString;

/**
 * A BSON codec for a Nashorn {@link NativeString}.
 * 
 * @author Tal Liron
 */
public class NativeStringCodec implements Codec<NativeString>
{
	//
	// Codec
	//

	public Class<NativeString> getEncoderClass()
	{
		return NativeString.class;
	}

	public void encode( BsonWriter writer, NativeString value, EncoderContext encoderContext )
	{
		writer.writeString( value.toString() );
	}

	public NativeString decode( BsonReader reader, DecoderContext decoderContext )
	{
		return (NativeString) NativeString.constructor( true, null, reader.readString() );
	}
}
